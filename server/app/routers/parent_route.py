from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.dto.api_response import ApiResponse
from app.services.parent_service import ParentService
from app.services.parent_chat_service import parent_chat
from app.schemas.parent import MessageCreate, ChatRequest, QuestionCreate, FollowUpCreate, SettingsUpdate

router = APIRouter(prefix="/parent", tags=["Parent"])

@router.get("/info/{parent_id}")
def get_parent_info(parent_id: int, db: Session = Depends(get_db)):
    data = ParentService.get_parent_info(db, parent_id)
    return ApiResponse(body=data, message="success")

@router.get("/children")
def get_children(parent_id: int = Query(...), db: Session = Depends(get_db)):
    data = ParentService.get_children(db, parent_id)
    return ApiResponse(body=data, message="success")


@router.get("/dashboard/{student_id}")
def get_dashboard(student_id: int, parent_id: int = Query(...), db: Session = Depends(get_db)):
    data = ParentService.get_dashboard(db, student_id, parent_id)
    return ApiResponse(body=data, message="success")


@router.get("/progress/{student_id}")
def get_progress(student_id: int, parent_id: int = Query(...), db: Session = Depends(get_db)):
    data = ParentService.get_progress(db, student_id, parent_id)
    return ApiResponse(body=data, message="success")


@router.get("/activities/{student_id}")
def get_activities(student_id: int, parent_id: int = Query(...), db: Session = Depends(get_db)):
    data = ParentService.get_activities(db, student_id, parent_id)
    return ApiResponse(body=data, message="success")


@router.put("/activities/{activity_id}/complete")
def complete_activity(activity_id: int, db: Session = Depends(get_db)):
    data = ParentService.complete_activity(db, activity_id)
    return ApiResponse(body=data, message="success")


@router.get("/teachers/{student_id}")
def get_teachers(student_id: int, parent_id: int = Query(...), db: Session = Depends(get_db)):
    data = ParentService.get_teachers(db, student_id, parent_id)
    return ApiResponse(body=data, message="success")


@router.get("/messages/{student_id}")
def get_messages(student_id: int, parent_id: int = Query(...), db: Session = Depends(get_db)):
    data = ParentService.get_messages(db, student_id, parent_id)
    return ApiResponse(body=data, message="success")


@router.post("/messages/{student_id}")
def send_message(student_id: int, payload: MessageCreate, parent_id: int = Query(...), db: Session = Depends(get_db)):
    data = ParentService.send_message(db, student_id, payload.teacherId, payload.text, parent_id)
    return ApiResponse(body=data, message="success")


@router.post("/chat/{student_id}")
def parent_chat_endpoint(
    student_id: int,
    payload: ChatRequest,
    parent_id: int = Query(...),
    db: Session = Depends(get_db),
):
    data = parent_chat(db, student_id, parent_id, payload.message)
    return ApiResponse(body=data, message="success")


@router.get("/questions/{student_id}")
def get_questions(student_id: int, parent_id: int = Query(...), db: Session = Depends(get_db)):
    data = ParentService.get_questions(db, student_id, parent_id)
    return ApiResponse(body=data, message="success")


@router.post("/questions/{student_id}")
def create_question(student_id: int, payload: QuestionCreate, parent_id: int = Query(...), db: Session = Depends(get_db)):
    data = ParentService.create_question(db, student_id, payload.subject, payload.content, payload.priority, parent_id)
    return ApiResponse(body=data, message="success")


@router.post("/questions/{question_id}/followup")
def add_followup(question_id: int, payload: FollowUpCreate, parent_id: int = Query(...), db: Session = Depends(get_db)):
    data = ParentService.add_followup(db, question_id, payload.content, parent_id)
    return ApiResponse(body=data, message="success")


@router.get("/settings")
def get_settings(parent_id: int = Query(...), db: Session = Depends(get_db)):
    data = ParentService.get_settings(db, parent_id)
    return ApiResponse(body=data, message="success")


@router.put("/settings")
def update_settings(payload: SettingsUpdate, parent_id: int = Query(...), db: Session = Depends(get_db)):
    data = ParentService.update_settings(db, payload.preferred_language, payload.notifications, parent_id)
    return ApiResponse(body=data, message="success")
