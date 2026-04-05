"""
RAG via FAISS under server/app/ai/data/.

Ingest: python -m app.ai.ingest_rag (from server/). Requires faiss-cpu, numpy, CURRICULLM_API_KEY.
"""

from __future__ import annotations

import json
import logging
import os
import re
from pathlib import Path
from typing import Any

from openai import OpenAI

from app.ai.config import Config

logger = logging.getLogger(__name__)

try:
    import faiss
    import numpy as np

    _FAISS_AVAILABLE = True
except ImportError:  # pragma: no cover
    faiss = None  # type: ignore[misc, assignment]
    np = None  # type: ignore[misc, assignment]
    _FAISS_AVAILABLE = False

_store_cache: dict[str, Any] | None = None


def _index_path() -> Path:
    return Path(Config.RAG_FAISS_INDEX_PATH)


def _chunks_path() -> Path:
    return Path(Config.RAG_CHUNKS_JSON_PATH)


def _load_store() -> tuple[Any, list[dict[str, Any]]] | None:
    global _store_cache
    ip = _index_path()
    cp = _chunks_path()
    if not ip.is_file() or not cp.is_file():
        return None
    mtime = ip.stat().st_mtime
    if _store_cache is not None and _store_cache.get("mtime") == mtime:
        return _store_cache["index"], _store_cache["chunks"]

    if not _FAISS_AVAILABLE:
        return None

    index = faiss.read_index(str(ip))
    chunks: list[dict[str, Any]] = json.loads(cp.read_text(encoding="utf-8"))
    _store_cache = {"mtime": mtime, "index": index, "chunks": chunks}
    return index, chunks


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


def _search_faiss_with_embedding(embedding: list[float]) -> str:
    if not _FAISS_AVAILABLE or np is None or faiss is None:
        return ""

    loaded = _load_store()
    if loaded is None:
        return ""

    index, chunk_rows = loaded
    if index.ntotal == 0 or not chunk_rows:
        return ""

    if len(embedding) != int(index.d):
        logger.warning(
            "RAG skipped: query embedding dim %s != index dim %s (check EMBEDDING_MODEL / re-run ingest)",
            len(embedding),
            int(index.d),
        )
        return ""

    k = min(Config.RAG_TOP_K, index.ntotal)
    q = np.array([embedding], dtype=np.float32)
    faiss.normalize_L2(q)
    try:
        _scores, ids = index.search(q, k)
    except Exception as e:
        logger.warning("RAG vector search failed (continuing without RAG): %s", e)
        return ""

    picked: list[str] = []
    for j in ids[0]:
        idx = int(j)
        if idx < 0 or idx >= len(chunk_rows):
            continue
        text = str(chunk_rows[idx].get("content", "")).strip()
        if text:
            picked.append(text)

    if not picked:
        return ""

    return "\n\n---\n\n".join(picked)


def retrieve_rag_context(student_payload: dict[str, Any]) -> str:
    if not Config.RAG_ENABLED:
        return ""

    if not _FAISS_AVAILABLE:
        logger.warning(
            "RAG skipped: faiss-cpu and numpy are not installed "
            "(pip install faiss-cpu numpy)"
        )
        return ""

    query_text = _build_rag_query(student_payload)
    if not query_text:
        return ""

    try:
        embedding = embed_query(query_text)
    except Exception as e:
        logger.warning("RAG embedding failed (continuing without RAG): %s", e)
        return ""

    if not embedding:
        return ""

    out = _search_faiss_with_embedding(embedding)
    if not out and (
        not _index_path().is_file() or not _chunks_path().is_file()
    ):
        logger.warning(
            "RAG skipped: missing FAISS index or chunks JSON at %s / %s — run python -m app.ai.ingest_rag",
            _index_path(),
            _chunks_path(),
        )
    return out


def retrieve_kb_for_text_query(query_text: str) -> str:
    if not Config.RAG_ENABLED:
        return ""

    if not _FAISS_AVAILABLE:
        return ""

    query_text = query_text.strip()
    if not query_text:
        return ""

    try:
        embedding = embed_query(query_text)
    except Exception as e:
        logger.warning("Parent-chat KB embedding failed (continuing without KB): %s", e)
        return ""

    if not embedding:
        return ""

    return _search_faiss_with_embedding(embedding)


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
    if not _FAISS_AVAILABLE:
        raise ImportError(
            "faiss-cpu and numpy are required for RAG ingest. "
            "Run: pip install faiss-cpu numpy"
        )

    paths = sorted(list(data_dir.glob("**/*.txt")) + list(data_dir.glob("**/*.md")))
    if not paths:
        return 0

    rows: list[dict[str, Any]] = []
    vectors: list[list[float]] = []

    for path in paths:
        rel = os.path.relpath(path, data_dir)
        raw = path.read_text(encoding="utf-8", errors="replace")
        pieces = chunk_text(raw)
        if not pieces:
            continue
        embeddings = embed_texts(pieces)
        for idx, (content, emb) in enumerate(zip(pieces, embeddings)):
            rows.append(
                {"source_path": rel, "chunk_index": idx, "content": content}
            )
            vectors.append(emb)

    if not vectors:
        return 0

    dim = len(vectors[0])
    if dim != Config.EMBEDDING_DIMENSION:
        logger.warning(
            "Embedding dim %s differs from Config.EMBEDDING_DIMENSION %s — using actual dim",
            dim,
            Config.EMBEDDING_DIMENSION,
        )

    matrix = np.array(vectors, dtype=np.float32)
    faiss.normalize_L2(matrix)
    index = faiss.IndexFlatIP(dim)
    index.add(matrix)

    ip = _index_path()
    cp = _chunks_path()
    ip.parent.mkdir(parents=True, exist_ok=True)
    faiss.write_index(index, str(ip))
    cp.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")

    global _store_cache
    _store_cache = None

    return len(rows)
