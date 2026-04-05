from typing import Any

"""Lazy imports from app.ai so the API can start before optional deps touch the DB."""


def generate_draft_parent_report(student_id: int) -> int:
    from app.ai.report_service import generate_report_for_student

    return generate_report_for_student(student_id, auto_approve=False)


def get_pending_reports() -> list[dict[str, Any]]:
    from app.ai.repository import fetch_pending_ai_reports

    return fetch_pending_ai_reports()


def get_report(report_id: int) -> dict[str, Any] | None:
    from app.ai.repository import fetch_ai_report_by_id

    return fetch_ai_report_by_id(report_id)


def patch_draft_report(
    report_id: int,
    *,
    summary: str | None = None,
    strengths: list[str] | None = None,
    support_areas: list[str] | None = None,
    recommendations: list[str] | None = None,
) -> bool:
    from app.ai.repository import update_ai_report_draft

    return update_ai_report_draft(
        report_id,
        summary=summary,
        strengths=strengths,
        support_areas=support_areas,
        recommendations=recommendations,
    )


def students_for_dropdown() -> list[dict[str, Any]]:
    from app.ai.repository import list_students_brief

    return list_students_brief()
