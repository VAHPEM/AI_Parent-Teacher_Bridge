from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.dto.api_response import ApiResponse
from app.services.parent_service import ParentService
from app.services.parent_chat_service import parent_chat
from app.schemas.parent import MessageCreate, ChatRequest, QuestionCreate, FollowUpCreate, SettingsUpdate
from app.services.translation_service import TranslationService
from app.exceptions.app_exception import AppException

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


@router.get("/chat/v2/sessions")
def get_chat_sessions_v2(parent_id: int = Query(...), db: Session = Depends(get_db)):
    data = ParentService.get_chat_sessions_v2(db, parent_id)
    return ApiResponse(body=data, message="success")


@router.post("/chat/v2/sessions")
def create_chat_session_v2(parent_id: int = Query(...), language: str = Query("en"), db: Session = Depends(get_db)):
    data = ParentService.create_chat_session_v2(db, parent_id, language)
    return ApiResponse(body=data, message="success")


@router.get("/chat/v2/sessions/messages")
def get_session_messages_v2(session_id: int = Query(...), parent_id: int = Query(...), db: Session = Depends(get_db)):
    data = ParentService.get_session_messages_v2(db, session_id, parent_id)
    return ApiResponse(body=data, message="success")


@router.post("/chat/v2")
def parent_chat_v2(
    payload: ChatRequest,
    parent_id: int = Query(...),
    db: Session = Depends(get_db),
):
    from app.models.student import Student as StudentModel
    pref_lang = ParentService._get_parent_language(db, parent_id) or "en"

    # Pick first child as the "primary" context anchor
    first_child = db.query(StudentModel).filter(StudentModel.parent_id == parent_id).first()
    if not first_child:
        raise AppException("No children found for this parent", 404)

    if payload.session_id is None:
        created = ParentService.create_chat_session_v2(db, parent_id, pref_lang)
        session_id = int(created["id"])
    else:
        session_id = payload.session_id
        ParentService.assert_chat_session_v2(db, session_id, parent_id)

    ParentService.add_chat_message(db, session_id, "parent", payload.message)
    data = parent_chat(db, first_child.id, parent_id, payload.message)
    reply_en = str(data.get("reply") or "").strip()

    reply_out = TranslationService.translate_from_english(reply_en, pref_lang) if pref_lang != "en" else reply_en

    ParentService.add_chat_message(db, session_id, "ai", reply_out)
    return ApiResponse(body={**data, "reply": reply_out, "session_id": session_id}, message="success")


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
def get_session_messages(
    student_id: int,
    session_id: int = Query(...),
    parent_id: int = Query(...),
    db: Session = Depends(get_db),
):
    data = ParentService.get_session_messages(db, session_id, student_id, parent_id)
    return ApiResponse(body=data, message="success")


@router.post("/chat/{student_id}")
def parent_chat_endpoint(
    student_id: int,
    payload: ChatRequest,
    parent_id: int = Query(...),
    db: Session = Depends(get_db),
):
    pref_lang = ParentService._get_parent_language(db, parent_id) or "en"

    if payload.session_id is None:
        created = ParentService.create_chat_session(db, student_id, parent_id, pref_lang)
        session_id = int(created["id"])
    else:
        session_id = payload.session_id
        ParentService.assert_chat_session(db, session_id, student_id, parent_id)

    ParentService.add_chat_message(db, session_id, "parent", payload.message)
    data = parent_chat(db, student_id, parent_id, payload.message)
    reply_en = str(data.get("reply") or "").strip()

    if pref_lang != "en":
        reply_out = TranslationService.translate_from_english(reply_en, pref_lang)
    else:
        reply_out = reply_en

    ParentService.add_chat_message(db, session_id, "ai", reply_out)
    body = {**data, "reply": reply_out, "session_id": session_id}
    return ApiResponse(body=body, message="success")


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
