"""Parent Q&A grounded on the latest teacher-approved report; optional pgvector RAG."""

from __future__ import annotations

import json
from typing import Any

from app.ai.curricullm_client import CurricuLLMClient
from app.ai.rag_store import retrieve_kb_for_text_query
from app.ai.repository import fetch_latest_teacher_approved_report, fetch_student_profile

_client: CurricuLLMClient | None = None


def _llm() -> CurricuLLMClient:
    global _client
    if _client is None:
        _client = CurricuLLMClient()
    return _client


def _jsonish(x: Any) -> str:
    if x is None:
        return ""
    if isinstance(x, (list, dict)):
        return json.dumps(x, ensure_ascii=False)
    return str(x)


def format_approved_report_for_context(
    report: dict[str, Any], *, student_name: str
) -> str:
    lines = [
        f"This approved report applies ONLY to **{student_name}** (student_id={report.get('student_id')}).",
        f"Report ID: {report.get('id')}",
        f"Week {report.get('week_number')}, {report.get('term') or ''}".strip(),
        f"Risk level (informational): {report.get('risk_level') or ''}",
        "",
        "## Summary",
        (report.get("summary") or "").strip(),
        "",
        "## Strengths",
        _jsonish(report.get("strengths")),
        "",
        "## Support areas",
        _jsonish(report.get("support_areas")),
        "",
        "## Recommendations for home",
        _jsonish(report.get("recommendations")),
    ]
    return "\n".join(lines)


def _no_report_reply(student_id: int) -> str:
    """Do not call the LLM without an approved report — avoids invented progress answers."""
    profile = fetch_student_profile(student_id)
    name = (profile or {}).get("student_name")
    if name:
        return (
            f"There isn't a teacher-approved report for {name} yet, so I can't answer "
            "questions about their school progress from official information. "
            "Once their teacher shares a report, you can ask me here again. "
            "In the meantime, use Ask a Teacher if you need to reach the teacher."
        )
    return (
        "Your child's teacher hasn't shared an approved learning report yet, "
        "so I don't have official information to answer questions about their progress. "
        "After a report is available, you can ask me here. "
        "Use Ask a Teacher in the meantime if you need to get in touch."
    )


def answer_parent_question(student_id: int, parent_message: str) -> str:
    report = fetch_latest_teacher_approved_report(student_id)
    if not report:
        return _no_report_reply(student_id)

    profile = fetch_student_profile(student_id)
    student_name = (
        (profile or {}).get("student_name") or f"Student {student_id}"
    )

    report_block = format_approved_report_for_context(
        report, student_name=student_name
    )

    kb_query = f"{parent_message}\n\nStudent: {student_name}"
    optional_kb = retrieve_kb_for_text_query(
        kb_query,
        student_id=student_id,
        exclude_report_id=report.get("id"),
    )

    return _llm().answer_parent_question(
        student_name=student_name,
        student_id=student_id,
        approved_report_text=report_block,
        optional_kb_excerpts=optional_kb or None,
        parent_message=parent_message,
    )
