from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.dto.api_response import ApiResponse
from app.services.teacher_service import TeacherService
from app.schemas.teacher import GradeEntrySubmit, RespondCreate, AIReportRevisionPayload, ActivityUpdatePayload
from app.models.teacher import Teacher

router = APIRouter(prefix="/teacher", tags=["Teacher"])


@router.get("/me")
def get_me(teacher_id: int = Query(...), db: Session = Depends(get_db)):
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        return ApiResponse(body={"name": "Teacher", "initials": "T", "email": ""}, message="success")
    parts = teacher.name.strip().split()
    initials = (parts[0][0] + parts[-1][0]).upper() if len(parts) >= 2 else parts[0][:2].upper()
    return ApiResponse(body={"name": teacher.name, "initials": initials, "email": teacher.email or ""}, message="success")


@router.get("/dashboard")
def get_dashboard(teacher_id: int = Query(...), db: Session = Depends(get_db)):
    data = TeacherService.get_dashboard(db, teacher_id)
    return ApiResponse(body=data, message="success")


@router.get("/classes")
def get_classes(teacher_id: int = Query(None), db: Session = Depends(get_db)):
    data = TeacherService.get_classes(db, teacher_id=teacher_id)
    return ApiResponse(body=data, message="success")


@router.get("/classes/{class_id}/students")
def get_class_students(class_id: int, db: Session = Depends(get_db)):
    data = TeacherService.get_class_students(db, class_id)
    return ApiResponse(body=data, message="success")


@router.get("/assessments")
def get_assessments(
    class_id: int = Query(...),
    week: int = Query(...),
    subject: str = Query(...),
    term: str = Query("Term 2"),
    db: Session = Depends(get_db),
):
    data = TeacherService.get_assessments(db, class_id, week, subject, term)
    return ApiResponse(body=data, message="success")


@router.get("/grade-entry")
def get_grade_entry(
    class_id: int = Query(...),
    assessment_id: int = Query(...),
    week: int = Query(...),
    subject: str = Query(...),
    term: str = Query("Term 2"),
    db: Session = Depends(get_db),
):
    data = TeacherService.get_grade_entry(db, class_id, assessment_id, week, subject, term)
    return ApiResponse(body=data, message="success")


@router.post("/grade-entry/draft")
def save_draft(payload: GradeEntrySubmit, db: Session = Depends(get_db)):
    data = TeacherService.save_grade_entry(
        db, payload.class_id, payload.assessment_id, payload.week, payload.term,
        payload.subject, [e.model_dump() for e in payload.entries], "draft"
    )
    return ApiResponse(body=data, message="success")


@router.post("/grade-entry/submit")
def submit_grades(
    payload: GradeEntrySubmit,
    teacher_id: int = Query(...),
    db: Session = Depends(get_db),
):
    entries = [e.model_dump() for e in payload.entries]
    data = TeacherService.save_grade_entry(
        db, payload.class_id, payload.assessment_id, payload.week, payload.term,
        payload.subject, entries, "submitted"
    )
    student_ids = list({int(e["student_id"]) for e in entries})
    ai_reports = TeacherService.generate_ai_reports_after_grade_submit(
        db, teacher_id, payload.class_id, payload.term, student_ids
    )
    # ai_reports = []
    return ApiResponse(body={**data, "ai_reports": ai_reports}, message="success")


@router.get("/ai-analysis")
def get_ai_analysis(teacher_id: int = Query(...), confidence: str = Query(None), db: Session = Depends(get_db)):
    data = TeacherService.get_ai_analysis(db, teacher_id, confidence)
    return ApiResponse(body=data, message="success")


@router.put("/activities/{activity_id}")
def update_activity(activity_id: int, payload: ActivityUpdatePayload, db: Session = Depends(get_db)):
    data = TeacherService.update_activity(db, activity_id, payload.title, payload.description, payload.steps, payload.curriculum_ref)
    return ApiResponse(body=data, message="success")


@router.put("/ai-analysis/{report_id}/approve")
def approve_analysis(
    report_id: int,
    teacher_notes: str | None = Query(None),
    db: Session = Depends(get_db),
):
    data = TeacherService.update_ai_analysis_status(
        db, report_id, "auto_approved", teacher_notes=teacher_notes
    )
    return ApiResponse(body=data, message="success")


@router.put("/ai-analysis/{report_id}/revise")
def revise_analysis(
    report_id: int,
    teacher_notes: str | None = Query(None),
    db: Session = Depends(get_db),
):
    data = TeacherService.update_ai_analysis_status(
        db, report_id, "needs_revision", teacher_notes=teacher_notes
    )
    return ApiResponse(body=data, message="success")


@router.put("/ai-analysis/{report_id}/revise-content")
def revise_content(
    report_id: int,
    payload: AIReportRevisionPayload,
    db: Session = Depends(get_db),
):
    data = TeacherService.revise_ai_report_content(
        db,
        report_id,
        summary=payload.summary,
        recommendations=payload.recommendations,
        support_areas=payload.support_areas,
        curriculum_ref=payload.curriculum_ref,
        teacher_notes=payload.teacher_notes,
    )
    return ApiResponse(body=data, message="success")


@router.post("/students/{student_id}/generate-ai-report")
def generate_student_ai_report(
    student_id: int,
    teacher_id: int = Query(...),
    term: str = Query("Term 2"),
    db: Session = Depends(get_db),
):
    data = TeacherService.generate_student_ai_report(db, teacher_id, student_id, term=term)
    return ApiResponse(body=data, message="success")


@router.get("/flagged-questions")
def get_flagged_questions(db: Session = Depends(get_db)):
    data = TeacherService.get_flagged_questions(db)
    return ApiResponse(body=data, message="success")


@router.post("/flagged-questions/{question_id}/respond")
def respond_to_question(question_id: int, payload: RespondCreate, teacher_id: int = Query(...), db: Session = Depends(get_db)):
    data = TeacherService.respond_to_question(db, question_id, payload.response, payload.method, teacher_id)
    return ApiResponse(body=data, message="success")


@router.post("/flagged-questions/{question_id}/schedule-call")
def schedule_call(question_id: int, db: Session = Depends(get_db)):
    data = TeacherService.schedule_call(db, question_id)
    return ApiResponse(body=data, message="success")


@router.get("/reports")
def get_reports(teacher_id: int = Query(...), class_id: int = Query(None), db: Session = Depends(get_db)):
    data = TeacherService.get_reports(db, teacher_id, class_id=class_id)
    return ApiResponse(body=data, message="success")


@router.post("/reports/generate")
def generate_report(
    teacher_id: int = Query(...),
    class_id: int = Query(1),
    term: str = Query("Term 2"),
    week: int = Query(8),
    db: Session = Depends(get_db),
):
    data = TeacherService.generate_report(db, teacher_id, class_id, term, week)
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
