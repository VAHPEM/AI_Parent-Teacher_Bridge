"""Embed ai_reports rows into Postgres (pgvector) for RAG."""

from __future__ import annotations

import json
import logging
from typing import Any

logger = logging.getLogger(__name__)


def ai_report_fields_to_text(
    summary: Any,
    strengths: Any,
    support_areas: Any,
    recommendations: Any,
) -> str:
    parts: list[str] = []
    if summary and str(summary).strip():
        parts.append(str(summary).strip())
    for label, val in (
        ("Strengths", strengths),
        ("Support areas", support_areas),
        ("Recommendations", recommendations),
    ):
        if val is None or val == [] or val == {}:
            continue
        if isinstance(val, (list, dict)):
            parts.append(f"{label}:\n{json.dumps(val, ensure_ascii=False)}")
        else:
            parts.append(f"{label}:\n{val}")
    return "\n\n".join(parts).strip()


def format_stored_report_excerpt(
    week_number: Any,
    term: Any,
    summary: Any,
    strengths: Any,
    support_areas: Any,
    recommendations: Any,
) -> str:
    body = ai_report_fields_to_text(
        summary, strengths, support_areas, recommendations
    )
    t = (term or "").strip()
    wk = week_number if week_number is not None else "?"
    return f"(Prior approved report — Week {wk}, {t})\n{body}".strip()


def sync_ai_report_embedding(cur, report_id: int) -> None:
    """
    Compute summary_embedding for one row. Call on the same psycopg2 cursor/transaction
    as INSERT/UPDATE so the vector stays consistent with the text.
    """
    cur.execute(
        """
        SELECT summary, strengths, support_areas, recommendations
        FROM ai_reports WHERE id = %s
        """,
        (report_id,),
    )
    row = cur.fetchone()
    if not row:
        return
    text = ai_report_fields_to_text(row[0], row[1], row[2], row[3])
    if not text:
        cur.execute(
            "UPDATE ai_reports SET summary_embedding = NULL WHERE id = %s",
            (report_id,),
        )
        return
    try:
        from app.ai.rag_store import embed_texts, l2_normalize_embedding

        emb = embed_texts([text])
        if not emb:
            return
        vec = l2_normalize_embedding(emb[0])
    except Exception as e:
        logger.warning(
            "Could not embed ai_reports.id=%s (RAG column left stale/NULL): %s",
            report_id,
            e,
        )
        return
    try:
        cur.execute(
            "UPDATE ai_reports SET summary_embedding = %s WHERE id = %s",
            (vec, report_id),
        )
    except Exception as e:
        logger.warning(
            "UPDATE summary_embedding failed for ai_reports.id=%s "
            "(dimension must match migration, e.g. vector(1536)): %s",
            report_id,
            e,
        )
