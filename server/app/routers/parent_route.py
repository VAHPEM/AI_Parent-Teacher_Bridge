from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.dto.api_response import ApiResponse
from app.services.parent_service import ParentService
from app.schemas.parent import MessageCreate, ChatRequest, QuestionCreate, FollowUpCreate, SettingsUpdate
from app.services.translation_service import TranslationService

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
def get_messages(student_id: int, parent_id: int = Query(...), db: Session = Depends(get_db)):
    data = ParentService.get_messages(db, student_id, parent_id)
    return ApiResponse(body=data, message="success")


@router.post("/messages/{student_id}")
def send_message(student_id: int, payload: MessageCreate, parent_id: int = Query(...), db: Session = Depends(get_db)):
    data = ParentService.send_message(db, student_id, payload.teacherId, payload.text, parent_id)
    return ApiResponse(body=data, message="success")


@router.get("/chat/sessions/{student_id}")
def get_chat_sessions(student_id: int, parent_id: int = Query(...), db: Session = Depends(get_db)):
    data = ParentService.get_chat_sessions(db, student_id, parent_id)
    return ApiResponse(body=data, message="success")


@router.post("/chat/sessions/{student_id}")
def create_chat_session(student_id: int, parent_id: int = Query(...), language: str = Query("en"), db: Session = Depends(get_db)):
    data = ParentService.create_chat_session(db, student_id, parent_id, language)
    return ApiResponse(body=data, message="success")


@router.delete("/chat/sessions/{session_id}")
def delete_chat_session(session_id: int, parent_id: int = Query(...), db: Session = Depends(get_db)):
    ParentService.delete_chat_session(db, session_id, parent_id)
    return ApiResponse(body={}, message="deleted")


@router.get("/chat/sessions/{student_id}/messages")
def get_session_messages(student_id: int, session_id: int = Query(...), db: Session = Depends(get_db)):
    data = ParentService.get_session_messages(db, session_id)
    return ApiResponse(body=data, message="success")


@router.post("/chat/{student_id}")
def parent_chat(student_id: int, payload: ChatRequest, parent_id: int = Query(...), db: Session = Depends(get_db)):
    pref_lang = ParentService._get_parent_language(db, parent_id)
    ParentService.add_chat_message(db, payload.session_id, "parent", payload.message)
    ai_reply_en = "I don't have enough data to answer that. Please ask the teacher directly."
    translated_reply = TranslationService.translate_from_english(ai_reply_en, pref_lang) if pref_lang != "en" else ai_reply_en
    ParentService.add_chat_message(db, payload.session_id, "ai", translated_reply)
    data = {"reply": translated_reply, "confidence": "low", "sources": []}
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
