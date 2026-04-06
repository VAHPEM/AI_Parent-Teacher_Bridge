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

PENDING_LOW_CONFIDENCE_MESSAGE = (
    "The latest progress summary for your child is still being reviewed by the teacher "
    "(low-confidence AI insight). Please check back after the teacher has approved it, "
    "or use Ask a Teacher for an immediate answer."
)

NEEDS_REVISION_MESSAGE = (
    "The latest progress summary is being updated by the teacher. "
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
    conf = confidence_from_risk(report.risk_level)
    if conf == "low":
        return bool(report.teacher_approved)
    return True


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

    report, newest = _latest_usable_report(db, student_id)

    if not newest:
        return {"reply": NO_REPORT_MESSAGE, "confidence": "low", "sources": []}

    if report is None:
        if (newest.status or "").lower() == "needs_revision":
            msg = NEEDS_REVISION_MESSAGE
        elif confidence_from_risk(newest.risk_level) == "low":
            msg = PENDING_LOW_CONFIDENCE_MESSAGE
        else:
            msg = NO_REPORT_MESSAGE
        return {"reply": msg, "confidence": "low", "sources": []}

    ctx = _report_context_block(report, student.name)
    first = student.name.split()[0] if student.name else "your child"

    try:
        reply = parent_chat_completion(ctx, message.strip(), first)
    except ValueError:
        return {"reply": NO_API_MESSAGE, "confidence": "low", "sources": []}
    except Exception:
        return {"reply": NO_API_MESSAGE, "confidence": "low", "sources": []}

    src = [f"AI report week {report.week_number}"]
    return {"reply": reply, "confidence": "medium", "sources": src}
