from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.dto.api_response import ApiResponse
from app.services.parent_service import ParentService
from app.schemas.parent import MessageCreate, ChatRequest, QuestionCreate, FollowUpCreate, SettingsUpdate

router = APIRouter(prefix="/parent", tags=["Parent"])


@router.get("/children")
def get_children(db: Session = Depends(get_db)):
    data = ParentService.get_children(db)
    return ApiResponse(body=data, message="success")


@router.get("/dashboard/{student_id}")
def get_dashboard(student_id: int, db: Session = Depends(get_db)):
    data = ParentService.get_dashboard(db, student_id)
    return ApiResponse(body=data, message="success")


@router.get("/progress/{student_id}")
def get_progress(student_id: int, db: Session = Depends(get_db)):
    data = ParentService.get_progress(db, student_id)
    return ApiResponse(body=data, message="success")


@router.get("/activities/{student_id}")
def get_activities(student_id: int, db: Session = Depends(get_db)):
    data = ParentService.get_activities(db, student_id)
    return ApiResponse(body=data, message="success")


@router.put("/activities/{activity_id}/complete")
def complete_activity(activity_id: int, db: Session = Depends(get_db)):
    data = ParentService.complete_activity(db, activity_id)
    return ApiResponse(body=data, message="success")


@router.get("/teachers/{student_id}")
def get_teachers(student_id: int, db: Session = Depends(get_db)):
    data = ParentService.get_teachers(db, student_id)
    return ApiResponse(body=data, message="success")


@router.get("/messages/{student_id}")
def get_messages(student_id: int, db: Session = Depends(get_db)):
    data = ParentService.get_messages(db, student_id)
    return ApiResponse(body=data, message="success")


@router.post("/messages/{student_id}")
def send_message(student_id: int, payload: MessageCreate, db: Session = Depends(get_db)):
    data = ParentService.send_message(db, student_id, payload.teacherId, payload.text)
    return ApiResponse(body=data, message="success")


@router.post("/chat/{student_id}")
def parent_chat(student_id: int, payload: ChatRequest, db: Session = Depends(get_db)):
    data = {"reply": "I don't have enough data to answer that. Please ask the teacher directly.", "confidence": "low", "sources": []}
    return ApiResponse(body=data, message="success")


@router.get("/questions/{student_id}")
def get_questions(student_id: int, db: Session = Depends(get_db)):
    data = ParentService.get_questions(db, student_id)
    return ApiResponse(body=data, message="success")


@router.post("/questions/{student_id}")
def create_question(student_id: int, payload: QuestionCreate, db: Session = Depends(get_db)):
    data = ParentService.create_question(db, student_id, payload.subject, payload.content, payload.priority)
    return ApiResponse(body=data, message="success")


@router.post("/questions/{question_id}/followup")
def add_followup(question_id: int, payload: FollowUpCreate, db: Session = Depends(get_db)):
    data = ParentService.add_followup(db, question_id, payload.content)
    return ApiResponse(body=data, message="success")


@router.get("/settings")
def get_settings(db: Session = Depends(get_db)):
    data = ParentService.get_settings(db)
    return ApiResponse(body=data, message="success")


@router.put("/settings")
def update_settings(payload: SettingsUpdate, db: Session = Depends(get_db)):
    data = ParentService.update_settings(db, payload.preferred_language, payload.notifications)
    return ApiResponse(body=data, message="success")
