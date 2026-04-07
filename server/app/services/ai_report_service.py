from __future__ import annotations

import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any

from sqlalchemy.orm import Session

from app.models.activity import Activity
from app.models.ai_report import AIReport
from app.models.parent import Parent
from app.models.student import Student
from app.models.subject import Subject
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

    recommendations = _ensure_list_of_strings(report.get("parent_actions", []))
    if not recommendations:
        recommendations = _ensure_list_of_strings(report.get("recommendations", []))

    parent_summary = str(
        report.get("parent_summary") or report.get("summary") or ""
    ).strip()

    normalized = {
        "student_id": report.get("student_id", db_student_id),
        "week_number": int(report.get("week_number", latest_week) or latest_week),
        "strengths": _ensure_list_of_strings(report.get("strengths", [])),
        "support_areas": _ensure_list_of_strings(report.get("support_areas", [])),
        "parent_summary": parent_summary,
        "recommendations": recommendations,
        "curriculum_ref": cref,
        "risk_level": calculated_risk,
    }

    if not normalized["parent_summary"]:
        normalized["parent_summary"] = "No summary was generated for this student."

    return normalized


def _resolve_subject_id(db: Session, subject_hint: Any) -> int | None:
    if subject_hint is None:
        return None
    s = str(subject_hint).strip()
    if not s:
        return None
    if s.isdigit():
        row = db.query(Subject).filter(Subject.id == int(s)).first()
        return row.id if row else None
    row = db.query(Subject).filter(Subject.subject_name.ilike(s)).first()
    if row:
        return row.id
    row = db.query(Subject).filter(Subject.subject_name.ilike(f"%{s}%")).first()
    return row.id if row else None


def _persist_activities_for_report(
    db: Session,
    report: AIReport,
    items: list[Any],
    report_curriculum_ref: str | None,
) -> None:
    """Replace prior AI-linked activities for this student; attach new rows to ``report``."""
    db.query(Activity).filter(
        Activity.student_id == report.student_id,
        Activity.ai_report_id.isnot(None),
    ).delete(synchronize_session=False)

    if not items:
        return

    sid = report.student_id
    for it in items:
        if not isinstance(it, dict):
            continue
        subj_id = _resolve_subject_id(db, it.get("subject_id"))
        steps = _ensure_list_of_strings(it.get("steps"))
        desc = str(it.get("description") or "").strip()
        ref = str(it.get("reference") or "").strip()
        cref = ref or (report_curriculum_ref or "") or ""
        cref = cref.strip()[:255] if cref else None
        title = str(it.get("title") or "").strip() or "Learning activity"
        db.add(
            Activity(
                student_id=sid,
                ai_report_id=report.id,
                subject_id=subj_id,
                title=title[:255],
                activity_type=str(it.get("type") or "home_learning").strip()[:100],
                duration=str(it.get("duration") or "").strip()[:50] or None,
                difficulty=str(it.get("difficulty") or "medium").strip()[:50],
                description=desc or None,
                steps=steps or None,
                curriculum_ref=cref,
            )
        )


def persist_ai_report_bundle(
    db: Session,
    student_id: int,
    term: str,
    bundle: dict[str, Any],
    payload: dict[str, Any],
) -> AIReport:
    """Write CurricuLLM output to ``ai_reports`` + ``activities``. Caller supplies an open session."""
    delete_stub_reports_for_student(db, student_id)

    inner_report = bundle.get("report") or {}
    activity_items = bundle.get("activities") or []
    if not isinstance(activity_items, list):
        activity_items = []

    normalized = validate_and_normalize_report(inner_report, payload)
    risk = normalized["risk_level"]

    status = "pending"
    teacher_ok = False

    recs = normalized["recommendations"]
    row = AIReport(
        student_id=normalized["student_id"],
        week_number=normalized["week_number"],
        term=term,
        summary=normalized["parent_summary"],
        strengths=normalized["strengths"],
        support_areas=normalized["support_areas"],
        recommendations=list(recs),
        curriculum_ref=normalized["curriculum_ref"] or None,
        risk_level=risk,
        status=status,
        teacher_approved=teacher_ok,
        sent_to_parent=False,
    )
    db.add(row)
    db.flush()
    _persist_activities_for_report(
        db,
        row,
        activity_items,
        normalized.get("curriculum_ref"),
    )
    db.commit()
    db.refresh(row)
    return row


def run_curricullm_for_student(
    student_id: int,
) -> tuple[int, dict[str, Any] | None, dict[str, Any] | None, str | None, int | None]:
    """
    Load payload (short DB use), then call CurricuLLM without holding a DB connection.

    Returns ``(student_id, payload, bundle, error_message, http_status_or_none)``.
    ``http_status`` is set when the error should trigger fail-fast (e.g. 503).
    """
    from app.db.database import SessionLocal

    db = SessionLocal()
    try:
        payload = fetch_student_payload(db, student_id)
        if not payload:
            return student_id, None, None, "Student not found", 404
        if not payload["weekly_records"]:
            return (
                student_id,
                None,
                None,
                "No weekly records for this student; add grades before generating a report.",
                400,
            )
    finally:
        db.close()

    try:
        bundle = generate_parent_report_json(payload)
    except ValueError as e:
        return student_id, None, None, str(e), 503
    return student_id, payload, bundle, None, None


def generate_ai_reports_for_students_parallel(
    student_ids: list[int],
    term: str,
    *,
    max_workers: int | None = None,
    reraise_server_error: bool = False,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """
    Run CurricuLLM concurrently (I/O bound), then persist each result on its own session.

    ``AI_REPORT_MAX_WORKERS`` env caps concurrency (default 5).
    """
    from app.db.database import SessionLocal

    ids = list(dict.fromkeys(student_ids))
    if not ids:
        return [], []

    default_w = int(os.getenv("AI_REPORT_MAX_WORKERS", "5"))
    w = default_w if max_workers is None else max_workers
    workers = max(1, min(w, len(ids)))

    created: list[dict[str, Any]] = []
    skipped: list[dict[str, Any]] = []

    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(run_curricullm_for_student, sid): sid for sid in ids}
        for fut in as_completed(futures):
            sid, payload, bundle, err, status = fut.result()
            if err:
                if reraise_server_error and status is not None and status >= 500:
                    raise AppException(err, status)
                skipped.append({"student_id": sid, "reason": err})
                continue
            assert payload is not None and bundle is not None
            db = SessionLocal()
            try:
                try:
                    row = persist_ai_report_bundle(db, sid, term, bundle, payload)
                    created.append({"student_id": sid, "report_id": row.id})
                except Exception as exc:
                    db.rollback()
                    skipped.append({"student_id": sid, "reason": str(exc)})
            finally:
                db.close()

    return created, skipped


def create_ai_report_for_student(db: Session, student_id: int, term: str = "Term 2") -> AIReport:
    payload = fetch_student_payload(db, student_id)
    if not payload:
        raise AppException("Student not found", 404)
    if not payload["weekly_records"]:
        raise AppException("No weekly records for this student; add grades before generating a report.", 400)

    try:
        bundle = generate_parent_report_json(payload)
    except ValueError as e:
        raise AppException(str(e), 503)

    return persist_ai_report_bundle(db, student_id, term, bundle, payload)


def assert_teacher_for_student(db: Session, teacher_id: int, student_id: int) -> None:
    from app.models.class_ import Class

    student = db.query(Student).filter(Student.id == student_id).first()
    if not student or student.class_id is None:
        raise AppException("Student or class not found", 404)
    cls = db.query(Class).filter(Class.id == student.class_id).first()
    if not cls or cls.teacher_id != teacher_id:
        raise AppException("Not allowed to manage this student", 403)
