from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.ai.report_service import generate_report_for_student
from app.ai.repository import (
    fetch_pending_ai_reports,
    list_students_brief,
    set_report_teacher_approved,
    update_ai_report_draft,
)
from app.db.database import get_db
from app.dto.api_response import ApiResponse
from app.exceptions.app_exception import AppException
from app.services.teacher_service import TeacherService

router = APIRouter(prefix="/teacher", tags=["Teacher"])


class AiReportPatchBody(BaseModel):
    summary: str | None = None
    strengths: list[str] | None = None
    support_areas: list[str] | None = None
    recommendations: list[str] | None = None


class GradeEntryPayload(BaseModel):
    class_id: int
    week: int
    term: str
    subject: str
    entries: list[dict]


@router.post("/student-record")
def create_student_record():
    return ApiResponse(body=None, message="not implemented")


@router.get("/student-record/{student_id}")
def get_student_record(student_id: int):
    return ApiResponse(
        body={
            "student_id": student_id,
            "name": f"<Student ID> {student_id}",
        },
        message="success",
    )


@router.get("/students")
def list_students(
    teacher_id: int | None = Query(None),
    class_ids: str | None = Query(None, description="Comma-separated class ids"),
):
    parsed_ids: list[int] | None = None
    if class_ids and class_ids.strip():
        try:
            parsed_ids = [int(x.strip()) for x in class_ids.split(",") if x.strip()]
        except ValueError:
            raise AppException("Invalid class_ids", 400)
    body = list_students_brief(
        filter_teacher_id=teacher_id, filter_class_ids=parsed_ids
    )
    return ApiResponse(body=body, message="success")


@router.post("/generate-report/{student_id}")
def generate_ai_report(student_id: int):
    try:
        report_id = generate_report_for_student(student_id, auto_approve=False)
    except ValueError as e:
        raise AppException(str(e), 404) from e
    return ApiResponse(
        body={"report_id": report_id, "student_id": student_id},
        message="success",
    )


@router.get("/ai-reports/pending")
def ai_reports_pending():
    return ApiResponse(body=fetch_pending_ai_reports(), message="success")


@router.patch("/ai-reports/{report_id}")
def ai_reports_patch(report_id: int, payload: AiReportPatchBody):
    ok = update_ai_report_draft(
        report_id,
        summary=payload.summary,
        strengths=payload.strengths,
        support_areas=payload.support_areas,
        recommendations=payload.recommendations,
    )
    if not ok:
        raise AppException("Report not found or already approved", 400)
    return ApiResponse(body={"report_id": report_id}, message="success")


@router.post("/approve-report/{report_id}")
def approve_report(report_id: int):
    updated = set_report_teacher_approved(report_id)
    if not updated:
        raise AppException("Report not found", 404)
    return ApiResponse(body={"report_id": report_id}, message="success")


@router.get("/dashboard")
def teacher_dashboard(
    teacher_id: int = Query(...), db: Session = Depends(get_db)
):
    data = TeacherService.get_dashboard(db, teacher_id)
    return ApiResponse(body=data, message="success")


@router.get("/classes")
def teacher_classes(db: Session = Depends(get_db)):
    return ApiResponse(body=TeacherService.get_classes(db), message="success")


@router.get("/classes/{class_id}/students")
def class_students(class_id: int, db: Session = Depends(get_db)):
    return ApiResponse(
        body=TeacherService.get_class_students(db, class_id), message="success"
    )


@router.get("/grade-entry")
def grade_entry(
    class_id: int = Query(...),
    week: int = Query(...),
    subject: str = Query(...),
    term: str = Query("Term 2"),
    db: Session = Depends(get_db),
):
    data = TeacherService.get_grade_entry(db, class_id, week, subject, term)
    return ApiResponse(body=data, message="success")


@router.post("/grade-entry/draft")
def grade_entry_draft(payload: GradeEntryPayload, db: Session = Depends(get_db)):
    data = TeacherService.save_grade_entry(
        db,
        payload.class_id,
        payload.week,
        payload.term,
        payload.subject,
        payload.entries,
        "draft",
    )
    return ApiResponse(body=data, message="success")


@router.post("/grade-entry/submit")
def grade_entry_submit(payload: GradeEntryPayload, db: Session = Depends(get_db)):
    data = TeacherService.save_grade_entry(
        db,
        payload.class_id,
        payload.week,
        payload.term,
        payload.subject,
        payload.entries,
        "submit",
    )
    return ApiResponse(body=data, message="success")


@router.get("/flagged-questions")
def flagged_questions(db: Session = Depends(get_db)):
    return ApiResponse(body=TeacherService.get_flagged_questions(db), message="success")


class QuestionRespondBody(BaseModel):
    response: str
    method: str


@router.post("/flagged-questions/{question_id}/respond")
def flagged_respond(
    question_id: int,
    payload: QuestionRespondBody,
    teacher_id: int = Query(...),
    db: Session = Depends(get_db),
):
    data = TeacherService.respond_to_question(
        db, question_id, payload.response, payload.method, teacher_id
    )
    return ApiResponse(body=data, message="success")


@router.post("/flagged-questions/{question_id}/schedule-call")
def flagged_schedule(question_id: int, db: Session = Depends(get_db)):
    data = TeacherService.schedule_call(db, question_id)
    return ApiResponse(body=data, message="success")


@router.get("/reports")
def teacher_reports(
    teacher_id: int = Query(...), db: Session = Depends(get_db)
):
    return ApiResponse(
        body=TeacherService.get_reports(db, teacher_id), message="success"
    )


@router.post("/reports/generate")
def teacher_reports_generate(
    class_id: int = Query(...),
    term: str = Query(...),
    week: int = Query(...),
    db: Session = Depends(get_db),
):
    data = TeacherService.generate_report(db, class_id, term, week)
    return ApiResponse(body=data, message="success")


@router.get("/canvas/status")
def canvas_status(db: Session = Depends(get_db)):
    return ApiResponse(body=TeacherService.get_canvas_status(db), message="success")


@router.get("/canvas/history")
def canvas_history(db: Session = Depends(get_db)):
    return ApiResponse(body=TeacherService.get_canvas_history(db), message="success")


@router.post("/canvas/sync")
def canvas_sync(db: Session = Depends(get_db)):
    data = TeacherService.run_canvas_sync(db)
    return ApiResponse(body=data, message="success")


@router.get("/ai-analysis")
def ai_analysis(
    confidence: str | None = Query(None), db: Session = Depends(get_db)
):
    _ = confidence
    return ApiResponse(body=TeacherService.get_ai_analysis(db), message="success")


@router.put("/ai-analysis/{report_id}/approve")
def ai_analysis_approve(report_id: int, db: Session = Depends(get_db)):
    data = TeacherService.update_ai_analysis_status(
        db, report_id, "auto_approved"
    )
    return ApiResponse(body=data, message="success")


@router.put("/ai-analysis/{report_id}/revise")
def ai_analysis_revise(report_id: int, db: Session = Depends(get_db)):
    data = TeacherService.update_ai_analysis_status(
        db, report_id, "needs_revision"
    )
    return ApiResponse(body=data, message="success")
