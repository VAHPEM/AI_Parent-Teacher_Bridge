from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.student import Student
from app.models.ai_report import AIReport
from app.exceptions.app_exception import AppException
from app.services.ai_report_service import confidence_from_risk
from app.services.curricullm_service import parent_chat_completion


NO_REPORT_MESSAGE = (
    "There is no AI progress report for this student yet. "
    "Once the teacher has generated and shared a summary, I can help answer questions about it."
)

NO_REPORT_MESSAGE_FAMILY = (
    "There are no AI progress reports for your children yet. "
    "Once their teachers have generated and shared summaries, I can help answer questions about them."
)

PENDING_LOW_CONFIDENCE_MESSAGE = (
    "The latest progress summary for your child is still being reviewed by the teacher "
    "(low-confidence AI insight). Please check back after the teacher has approved it, "
    "or use Ask a Teacher for an immediate answer."
)

PENDING_LOW_CONFIDENCE_MESSAGE_FAMILY = (
    "One or more of your children's latest progress summaries are still being reviewed by the teacher "
    "(low-confidence AI insight). Please check back after the teacher has approved them, "
    "or use Ask a Teacher for an immediate answer."
)

NEEDS_REVISION_MESSAGE = (
    "The latest progress summary is being updated by the teacher. "
    "Please try again later or message the teacher directly."
)

NEEDS_REVISION_MESSAGE_FAMILY = (
    "One or more progress summaries are being updated by the teacher. "
    "Please try again later or message the teacher directly."
)

NO_API_MESSAGE = (
    "The AI assistant is not fully configured right now. Please contact your child's teacher for details."
)


def _report_context_block(report: AIReport, student_name: str) -> str:
    parts = [
        f"Student name: {student_name}",
        f"Week: {report.week_number}, Term: {report.term or 'N/A'}",
        f"Summary: {report.summary or ''}",
        f"Strengths: {report.strengths or []}",
        f"Support areas: {report.support_areas or []}",
        f"Suggested recommendations: {report.recommendations or []}",
        f"Risk level (internal): {report.risk_level or 'unknown'}",
    ]
    if report.teacher_notes:
        parts.append(f"Teacher review notes (authoritative): {report.teacher_notes}")
    return "\n".join(parts)


def report_usable_for_parent_chat(report: AIReport) -> bool:
    st = (report.status or "").lower()
    if st == "needs_revision":
        return False
    return bool(report.teacher_approved)


def _latest_usable_report(db: Session, student_id: int) -> tuple[AIReport | None, AIReport | None]:
    """
    Returns (usable_report, newest_report).
    Parent chat uses the newest report that passes review rules, not only the newest row
    (otherwise a pending high-risk row hides an older auto-approved report).
    """
    rows = (
        db.query(AIReport)
        .filter(AIReport.student_id == student_id)
        .order_by(desc(AIReport.created_at))
        .limit(25)
        .all()
    )
    if not rows:
        return None, None
    newest = rows[0]
    for r in rows:
        if report_usable_for_parent_chat(r):
            return r, newest
    return None, newest


def _students_for_parent(db: Session, parent_id: int) -> list[Student]:
    return (
        db.query(Student)
        .filter(Student.parent_id == parent_id)
        .order_by(Student.id)
        .all()
    )


def _first_name(name: str | None) -> str:
    if not name or not str(name).strip():
        return "your child"
    return str(name).split()[0]


def _family_blocked_reply(db: Session, siblings: list[Student], multi: bool) -> dict | None:
    """
    If no child has a usable report, return a single user-facing dict.
    Otherwise return None (caller should call the model).
    """
    if not siblings:
        return {"reply": NO_REPORT_MESSAGE_FAMILY if multi else NO_REPORT_MESSAGE, "confidence": "low", "sources": []}

    has_any_usable = False
    has_any_newest = False
    any_needs_revision = False
    any_pending_low = False

    for stu in siblings:
        usable, newest = _latest_usable_report(db, stu.id)
        if usable:
            has_any_usable = True
            break
        if newest:
            has_any_newest = True
            st = (newest.status or "").lower()
            if st == "needs_revision":
                any_needs_revision = True
            elif confidence_from_risk(newest.risk_level) == "low" and not newest.teacher_approved:
                any_pending_low = True

    if has_any_usable:
        return None

    if not has_any_newest:
        return {
            "reply": NO_REPORT_MESSAGE_FAMILY if multi else NO_REPORT_MESSAGE,
            "confidence": "low",
            "sources": [],
        }
    if any_needs_revision:
        return {
            "reply": NEEDS_REVISION_MESSAGE_FAMILY if multi else NEEDS_REVISION_MESSAGE,
            "confidence": "low",
            "sources": [],
        }
    if any_pending_low:
        return {
            "reply": PENDING_LOW_CONFIDENCE_MESSAGE_FAMILY if multi else PENDING_LOW_CONFIDENCE_MESSAGE,
            "confidence": "low",
            "sources": [],
        }
    return {
        "reply": NO_REPORT_MESSAGE_FAMILY if multi else NO_REPORT_MESSAGE,
        "confidence": "low",
        "sources": [],
    }


def _build_family_report_context(db: Session, siblings: list[Student]) -> tuple[str, list[str]]:
    parts: list[str] = []
    sources: list[str] = []
    for stu in siblings:
        report, newest = _latest_usable_report(db, stu.id)
        header = f"=== {stu.name} ==="
        if report:
            parts.append(f"{header}\n{_report_context_block(report, stu.name)}")
            sources.append(f"{_first_name(stu.name)}: week {report.week_number}")
        elif newest:
            st = (newest.status or "").lower()
            if st == "needs_revision":
                parts.append(f"{header}\n[No usable summary: teacher is updating the latest report.]")
            elif confidence_from_risk(newest.risk_level) == "low" and not newest.teacher_approved:
                parts.append(f"{header}\n[No usable summary: awaiting teacher approval on low-confidence insight.]")
            else:
                parts.append(f"{header}\n[No usable summary on file.]")
        else:
            parts.append(f"{header}\n[No AI progress report on file yet.]")
    return "\n\n".join(parts), sources


def parent_chat(
    db: Session,
    student_id: int,
    parent_id: int,
    message: str,
) -> dict:
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise AppException("Student not found", 404)
    if student.parent_id != parent_id:
        raise AppException("Not allowed to chat for this student", 403)

    siblings = _students_for_parent(db, parent_id)
    multi = len(siblings) > 1

    blocked = _family_blocked_reply(db, siblings, multi)
    if blocked is not None:
        return blocked

    ctx, sources = _build_family_report_context(db, siblings)
    primary_first = _first_name(student.name)
    all_first = [_first_name(s.name) for s in siblings]

    try:
        reply = parent_chat_completion(
            ctx,
            message.strip(),
            primary_first,
            all_first_names=all_first,
        )
    except ValueError:
        return {"reply": NO_API_MESSAGE, "confidence": "low", "sources": []}
    except Exception:
        return {"reply": NO_API_MESSAGE, "confidence": "low", "sources": []}

    return {"reply": reply, "confidence": "medium", "sources": sources}
