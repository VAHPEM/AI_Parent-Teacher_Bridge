"""
RAG over Postgres pgvector. Keeps retrieval isolated so the rest of the pipeline stays unchanged.

Requires: extension + table from sql/001_rag_pgvector.sql and populated rows (see ingest_rag.py).
If RAG is disabled, the extension is missing, or the table is empty, retrieval returns "".
"""

from __future__ import annotations

import logging
import os
import re
from pathlib import Path
from typing import Any

from openai import OpenAI
import psycopg2

try:
    from pgvector.psycopg2 import register_vector as _register_vector
except ImportError:  # pragma: no cover - optional until pip install pgvector
    _register_vector = None

from config import Config
from db import DB_CONFIG, get_db_connection

logger = logging.getLogger(__name__)


def _register_vector_on_conn(conn) -> None:
    if _register_vector is None:
        raise ImportError("pgvector package is not installed (pip install pgvector)")
    _register_vector(conn)


def _embedding_client() -> OpenAI:
    if not Config.CURRICULLM_API_KEY:
        raise ValueError("CURRICULLM_API_KEY is required for embeddings")
    return OpenAI(
        api_key=Config.CURRICULLM_API_KEY,
        base_url=Config.CURRICULLM_BASE_URL,
    )


def embed_texts(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    client = _embedding_client()
    resp = client.embeddings.create(model=Config.EMBEDDING_MODEL, input=texts)
    # Preserve order of inputs
    data = sorted(resp.data, key=lambda d: d.index)
    return [list(d.embedding) for d in data]


def embed_query(text: str) -> list[float]:
    vectors = embed_texts([text])
    return vectors[0] if vectors else []


def _build_rag_query(student_payload: dict[str, Any]) -> str:
    student = student_payload.get("student") or {}
    records = student_payload.get("weekly_records") or []
    parts: list[str] = [
        f"Grade {student.get('grade_level', '')} class {student.get('class_name', '')}.",
        f"Student focus areas from recent records:",
    ]
    for r in records[-12:]:
        subj = r.get("subject") or ""
        skill = r.get("skill") or ""
        score = r.get("score")
        comment = (r.get("teacher_comment") or "").strip()
        parts.append(f"{subj} / {skill}: score {score}. {comment}".strip())
    return "\n".join(parts).strip()


def retrieve_rag_context(student_payload: dict[str, Any]) -> str:
    if not Config.RAG_ENABLED:
        return ""

    if _register_vector is None:
        logger.warning("RAG skipped: install pgvector (pip install pgvector)")
        return ""

    query_text = _build_rag_query(student_payload)
    if not query_text:
        return ""

    try:
        embedding = embed_query(query_text)
    except Exception as e:
        logger.warning("RAG embedding failed (continuing without RAG): %s", e)
        return ""

    if len(embedding) != Config.EMBEDDING_DIMENSION:
        logger.warning(
            "RAG embedding dimension %s != Config.EMBEDDING_DIMENSION %s",
            len(embedding),
            Config.EMBEDDING_DIMENSION,
        )

    conn = get_db_connection()
    rows: list = []
    try:
        _register_vector_on_conn(conn)
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT content
                FROM rag_documents
                ORDER BY embedding <=> %s::vector
                LIMIT %s
                """,
                (embedding, Config.RAG_TOP_K),
            )
            rows = cur.fetchall()
    except Exception as e:
        logger.warning("RAG vector search failed (continuing without RAG): %s", e)
        return ""
    finally:
        conn.close()

    if not rows:
        return ""

    chunks = [str(r[0]).strip() for r in rows if r and r[0]]
    if not chunks:
        return ""

    return "\n\n---\n\n".join(chunks)


def chunk_text(text: str, max_chars: int = 1200) -> list[str]:
    text = text.strip()
    if not text:
        return []
    paras = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    chunks: list[str] = []
    buf = ""
    for p in paras:
        if len(buf) + len(p) + 2 <= max_chars:
            buf = f"{buf}\n\n{p}".strip() if buf else p
        else:
            if buf:
                chunks.append(buf)
            buf = p if len(p) <= max_chars else p[:max_chars]
    if buf:
        chunks.append(buf)
    return chunks


def ingest_directory(data_dir: Path) -> int:
    """
    Embed all .txt and .md files under data_dir and upsert into rag_documents.
    Returns number of chunks written.
    """
    paths = sorted(list(data_dir.glob("**/*.txt")) + list(data_dir.glob("**/*.md")))
    if not paths:
        return 0

    conn = psycopg2.connect(**DB_CONFIG)
    try:
        _register_vector_on_conn(conn)
        total = 0
        with conn.cursor() as cur:
            for path in paths:
                rel = os.path.relpath(path, data_dir)
                raw = path.read_text(encoding="utf-8", errors="replace")
                pieces = chunk_text(raw)
                if not pieces:
                    continue
                embeddings = embed_texts(pieces)
                for idx, (content, emb) in enumerate(zip(pieces, embeddings)):
                    cur.execute(
                        """
                        INSERT INTO rag_documents (source_path, chunk_index, content, embedding)
                        VALUES (%s, %s, %s, %s)
                        ON CONFLICT (source_path, chunk_index)
                        DO UPDATE SET content = EXCLUDED.content, embedding = EXCLUDED.embedding
                        """,
                        (rel, idx, content, emb),
                    )
                    total += 1
        conn.commit()
        return total
    finally:
        conn.close()
