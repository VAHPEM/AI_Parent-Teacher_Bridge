from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.dto.api_response import ApiResponse
from app.services.teacher_service import TeacherService
from app.schemas.teacher import GradeEntrySubmit, RespondCreate

router = APIRouter(prefix="/teacher", tags=["Teacher"])


@router.get("/dashboard")
def get_dashboard(db: Session = Depends(get_db)):
    data = TeacherService.get_dashboard(db)
    return ApiResponse(body=data, message="success")


@router.get("/classes")
def get_classes(db: Session = Depends(get_db)):
    data = TeacherService.get_classes(db)
    return ApiResponse(body=data, message="success")


@router.get("/classes/{class_id}/students")
def get_class_students(class_id: int, db: Session = Depends(get_db)):
    data = TeacherService.get_class_students(db, class_id)
    return ApiResponse(body=data, message="success")


@router.get("/grade-entry")
def get_grade_entry(
    class_id: int = Query(...),
    week: int = Query(...),
    subject: str = Query(...),
    term: str = Query("Term 2"),
    db: Session = Depends(get_db),
):
    data = TeacherService.get_grade_entry(db, class_id, week, subject, term)
    return ApiResponse(body=data, message="success")


@router.post("/grade-entry/draft")
def save_draft(payload: GradeEntrySubmit, db: Session = Depends(get_db)):
    data = TeacherService.save_grade_entry(
        db, payload.class_id, payload.week, payload.term, payload.subject,
        [e.model_dump() for e in payload.entries], "draft"
    )
    return ApiResponse(body=data, message="success")


@router.post("/grade-entry/submit")
def submit_grades(payload: GradeEntrySubmit, db: Session = Depends(get_db)):
    data = TeacherService.save_grade_entry(
        db, payload.class_id, payload.week, payload.term, payload.subject,
        [e.model_dump() for e in payload.entries], "submitted"
    )
    return ApiResponse(body=data, message="success")


@router.get("/ai-analysis")
def get_ai_analysis(confidence: str = Query(None), db: Session = Depends(get_db)):
    data = TeacherService.get_ai_analysis(db, confidence)
    return ApiResponse(body=data, message="success")


@router.put("/ai-analysis/{report_id}/approve")
def approve_analysis(report_id: int, db: Session = Depends(get_db)):
    data = TeacherService.update_ai_analysis_status(db, report_id, "auto_approved")
    return ApiResponse(body=data, message="success")


@router.put("/ai-analysis/{report_id}/revise")
def revise_analysis(report_id: int, db: Session = Depends(get_db)):
    data = TeacherService.update_ai_analysis_status(db, report_id, "needs_revision")
    return ApiResponse(body=data, message="success")


@router.get("/flagged-questions")
def get_flagged_questions(db: Session = Depends(get_db)):
    data = TeacherService.get_flagged_questions(db)
    return ApiResponse(body=data, message="success")


@router.post("/flagged-questions/{question_id}/respond")
def respond_to_question(question_id: int, payload: RespondCreate, db: Session = Depends(get_db)):
    data = TeacherService.respond_to_question(db, question_id, payload.response, payload.method)
    return ApiResponse(body=data, message="success")


@router.post("/flagged-questions/{question_id}/schedule-call")
def schedule_call(question_id: int, db: Session = Depends(get_db)):
    data = TeacherService.schedule_call(db, question_id)
    return ApiResponse(body=data, message="success")


@router.get("/reports")
def get_reports(db: Session = Depends(get_db)):
    data = TeacherService.get_reports(db)
    return ApiResponse(body=data, message="success")


@router.post("/reports/generate")
def generate_report(class_id: int = Query(1), term: str = Query("Term 2"), week: int = Query(8), db: Session = Depends(get_db)):
    data = TeacherService.generate_report(db, class_id, term, week)
    return ApiResponse(body=data, message="success")


@router.get("/canvas/status")
def canvas_status(db: Session = Depends(get_db)):
    data = TeacherService.get_canvas_status(db)
    return ApiResponse(body=data, message="success")


@router.get("/canvas/history")
def canvas_history(db: Session = Depends(get_db)):
    data = TeacherService.get_canvas_history(db)
    return ApiResponse(body=data, message="success")


@router.post("/canvas/sync")
def canvas_sync(db: Session = Depends(get_db)):
    data = TeacherService.run_canvas_sync(db)
    return ApiResponse(body=data, message="success")
