"""Parent Q&A grounded on the latest teacher-approved report; optional FAISS KB."""

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


def format_approved_report_for_context(report: dict[str, Any]) -> str:
    lines = [
        f"Report ID: {report.get('id')}",
        f"Student ID: {report.get('student_id')}",
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


def answer_parent_question(student_id: int, parent_message: str) -> str:
    report = fetch_latest_teacher_approved_report(student_id)
    if not report:
        raise ValueError(
            "No teacher-approved report is available for this student yet. "
            "Generate a report first (AUTO_APPROVE_AI_REPORTS=true for testing, "
            "or POST /teacher/approve-report/{report_id})."
        )

    profile = fetch_student_profile(student_id)
    student_name = (
        (profile or {}).get("student_name") or f"Student {student_id}"
    )

    report_block = format_approved_report_for_context(report)

    kb_query = f"{parent_message}\n\nStudent: {student_name}"
    optional_kb = retrieve_kb_for_text_query(kb_query)

    return _llm().answer_parent_question(
        student_name=student_name,
        approved_report_text=report_block,
        optional_kb_excerpts=optional_kb or None,
        parent_message=parent_message,
    )
