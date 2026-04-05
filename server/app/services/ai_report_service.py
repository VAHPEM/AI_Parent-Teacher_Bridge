from typing import Any

from sqlalchemy.orm import Session

from app.models.ai_report import AIReport
from app.models.parent import Parent
from app.models.student import Student
from app.models.weekly_record import WeeklyRecord
from app.exceptions.app_exception import AppException
from app.services.curricullm_service import generate_parent_report_json

# Legacy rows from the old stub generator (no CurricuLLM call)
STUB_SUMMARY_PREFIX = "AI-generated report for"


def delete_stub_reports_for_student(db: Session, student_id: int) -> int:
    rows = (
        db.query(AIReport)
        .filter(AIReport.student_id == student_id)
        .filter(AIReport.summary.like(f"{STUB_SUMMARY_PREFIX}%"))
        .all()
    )
    for r in rows:
        db.delete(r)
    if rows:
        db.commit()
    return len(rows)


def delete_stub_reports_for_class(db: Session, class_id: int) -> int:
    rows = (
        db.query(AIReport)
        .join(Student, AIReport.student_id == Student.id)
        .filter(Student.class_id == class_id)
        .filter(AIReport.summary.like(f"{STUB_SUMMARY_PREFIX}%"))
        .all()
    )
    for r in rows:
        db.delete(r)
    if rows:
        db.commit()
    return len(rows)


def fetch_student_payload(db: Session, student_id: int) -> dict[str, Any] | None:
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        return None
    parent = db.query(Parent).filter(Parent.id == student.parent_id).first()
    if not parent:
        return None

    records = (
        db.query(WeeklyRecord)
        .filter(WeeklyRecord.student_id == student_id)
        .order_by(WeeklyRecord.week_number, WeeklyRecord.subject, WeeklyRecord.skill)
        .all()
    )
    weekly_records = [
        {
            "record_id": r.id,
            "student_id": r.student_id,
            "week_number": r.week_number,
            "subject": r.subject,
            "skill": r.skill,
            "score": float(r.score) if r.score is not None else None,
            "teacher_comment": r.teacher_comment,
        }
        for r in records
    ]
    latest_week = max((r["week_number"] for r in weekly_records), default=0)

    return {
        "student": {
            "student_id": student.id,
            "student_name": student.name,
            "class_name": student.class_name or "",
            "grade_level": student.grade_level or "",
            "parent": {
                "parent_id": parent.id,
                "parent_name": parent.name,
                "preferred_language": parent.preferred_language or "en",
            },
        },
        "latest_week": latest_week,
        "weekly_records": weekly_records,
    }


def confidence_from_risk(risk_level: str | None) -> str:
    r = (risk_level or "low").lower()
    if r == "high":
        return "low"
    if r == "medium":
        return "medium"
    return "high"


def calculate_risk_from_records(student_payload: dict[str, Any]) -> tuple[str, bool]:
    records = student_payload["weekly_records"]

    subject_scores: dict[str, list[tuple[int, float]]] = {}
    negative_comment_count = 0
    strong_negative_comment_count = 0
    low_score_count = 0

    strong_negative_keywords = [
        "serious difficulty",
        "significant difficulty",
        "major difficulty",
        "very concerned",
        "urgent support",
        "struggles heavily",
        "far below",
        "at risk",
    ]

    moderate_negative_keywords = [
        "needs help",
        "needs support",
        "struggles",
        "difficulty",
        "challenging",
        "still needs help",
        "has difficulty",
    ]

    max_score = max(
        (float(r["score"]) for r in records if r.get("score") is not None),
        default=100.0,
    )
    use_percent_scale = max_score > 20

    for record in records:
        subject = record.get("subject")
        score = record.get("score")
        week_number = record.get("week_number")
        teacher_comment = (record.get("teacher_comment") or "").lower()

        if score is not None and subject is not None and week_number is not None:
            score_float = float(score)
            subject_scores.setdefault(subject, []).append((int(week_number), score_float))
            if use_percent_scale:
                if score_float <= 55:
                    low_score_count += 1
            elif score_float <= 5.5:
                low_score_count += 1

        if any(k in teacher_comment for k in strong_negative_keywords):
            strong_negative_comment_count += 1
        elif any(k in teacher_comment for k in moderate_negative_keywords):
            negative_comment_count += 1

    for subj in subject_scores:
        subject_scores[subj].sort(key=lambda x: x[0])

    for _, values in subject_scores.items():
        scores = [s for _, s in values]
        if len(scores) >= 3 and all(scores[i] > scores[i + 1] for i in range(len(scores) - 1)):
            return "high", True

    if low_score_count >= 3:
        return "high", True

    if strong_negative_comment_count >= 1:
        return "high", True

    if low_score_count >= 2 or negative_comment_count >= 2:
        return "medium", False

    return "low", False


def _ensure_list_of_strings(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(x).strip() for x in value if str(x).strip()]
    if isinstance(value, str) and value.strip():
        return [value.strip()]
    s = str(value).strip()
    return [s] if s else []


def validate_and_normalize_report(report: dict[str, Any], student_payload: dict[str, Any]) -> dict[str, Any]:
    latest_week = student_payload["latest_week"]
    db_student_id = student_payload["student"]["student_id"]
    calculated_risk, _ = calculate_risk_from_records(student_payload)

    cref = (
        report.get("curriculum_ref")
        or report.get("curriculum_alignment")
        or report.get("curriculum")
        or ""
    )
    cref = str(cref).strip()

    normalized = {
        "student_id": report.get("student_id", db_student_id),
        "week_number": int(report.get("week_number", latest_week) or latest_week),
        "strengths": _ensure_list_of_strings(report.get("strengths", [])),
        "support_areas": _ensure_list_of_strings(report.get("support_areas", [])),
        "parent_summary": str(report.get("parent_summary", "")).strip(),
        "parent_actions": _ensure_list_of_strings(report.get("parent_actions", [])),
        "curriculum_ref": cref,
        "risk_level": calculated_risk,
    }

    if not normalized["parent_summary"]:
        normalized["parent_summary"] = "No summary was generated for this student."

    return normalized


def create_ai_report_for_student(db: Session, student_id: int, term: str = "Term 2") -> AIReport:
    payload = fetch_student_payload(db, student_id)
    if not payload:
        raise AppException("Student not found", 404)
    if not payload["weekly_records"]:
        raise AppException("No weekly records for this student; add grades before generating a report.", 400)

    delete_stub_reports_for_student(db, student_id)

    try:
        raw = generate_parent_report_json(payload)
    except ValueError as e:
        raise AppException(str(e), 503)

    normalized = validate_and_normalize_report(raw, payload)
    risk = normalized["risk_level"]

    if risk == "high":
        status = "pending"
        teacher_ok = False
    else:
        status = "auto_approved"
        teacher_ok = True

    acts = normalized["parent_actions"]
    row = AIReport(
        student_id=normalized["student_id"],
        week_number=normalized["week_number"],
        term=term,
        summary=normalized["parent_summary"],
        strengths=normalized["strengths"],
        support_areas=normalized["support_areas"],
        improvement_areas=[],
        parent_actions=acts,
        recommendations=list(acts),
        curriculum_ref=normalized["curriculum_ref"] or None,
        risk_level=risk,
        status=status,
        teacher_approved=teacher_ok,
        sent_to_parent=False,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def assert_teacher_for_student(db: Session, teacher_id: int, student_id: int) -> None:
    from app.models.class_ import Class

    student = db.query(Student).filter(Student.id == student_id).first()
    if not student or student.class_id is None:
        raise AppException("Student or class not found", 404)
    cls = db.query(Class).filter(Class.id == student.class_id).first()
    if not cls or cls.teacher_id != teacher_id:
        raise AppException("Not allowed to manage this student", 403)
