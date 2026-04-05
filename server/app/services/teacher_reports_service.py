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


def students_for_dropdown(
    *,
    query_teacher_id: int | None = None,
    query_class_ids: list[int] | None = None,
) -> list[dict[str, Any]]:
    """
    Students the teacher can generate reports for.
    Scoped by `TEACHER_ID` / `TEACHER_CLASS_IDS` in .env, or `?teacher_id=` / `?class_ids=1,2`.
    """
    from app.ai.config import Config
    from app.ai.repository import list_students_brief

    tid = (
        query_teacher_id
        if query_teacher_id is not None
        else Config.TEACHER_ID
    )
    if query_class_ids is not None:
        cids = query_class_ids
    else:
        cids = Config.teacher_class_ids_list()
    cids_arg: list[int] | None = cids if cids else None

    return list_students_brief(
        filter_teacher_id=tid,
        filter_class_ids=cids_arg,
    )
