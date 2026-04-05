from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dto.api_response import ApiResponse
from app.schemas.parent import (
    FollowUpCreate,
    MessageCreate,
    QuestionCreate,
    SettingsUpdate,
)
from app.services.parent_chat import (
    get_latest_approved_report_for_parent,
    parent_chat_reply,
)
from app.services.parent_service import ParentService

router = APIRouter(prefix="/parent", tags=["Parent"])


class ParentChatBody(BaseModel):
    message: str = Field(..., min_length=1, max_length=8000)


@router.get("/info/{parent_id}")
def parent_info(parent_id: int, db: Session = Depends(get_db)):
    data = ParentService.get_parent_info(db, parent_id)
    return ApiResponse(body=data, message="success")


@router.get("/children")
def parent_children(parent_id: int = Query(...), db: Session = Depends(get_db)):
    data = ParentService.get_children(db, parent_id)
    return ApiResponse(body=data, message="success")


@router.get("/dashboard/{student_id}")
def parent_dashboard(student_id: int, db: Session = Depends(get_db)):
    data = ParentService.get_dashboard(db, student_id)
    return ApiResponse(body=data, message="success")


@router.get("/progress/{student_id}")
def parent_progress(student_id: int, db: Session = Depends(get_db)):
    data = ParentService.get_progress(db, student_id)
    return ApiResponse(body=data, message="success")


@router.get("/report/{student_id}")
def get_report(student_id: int):
    report = get_latest_approved_report_for_parent(student_id)
    return ApiResponse(body=report, message="success")


@router.post("/chat/{student_id}")
def parent_chat(student_id: int, body: ParentChatBody):
    reply = parent_chat_reply(student_id, body.message)
    return ApiResponse(body={"reply": reply}, message="success")


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
def get_messages(
    student_id: int, parent_id: int = Query(...), db: Session = Depends(get_db)
):
    data = ParentService.get_messages(db, student_id, parent_id)
    return ApiResponse(body=data, message="success")


@router.post("/messages/{student_id}")
def send_message(
    student_id: int,
    payload: MessageCreate,
    parent_id: int = Query(...),
    db: Session = Depends(get_db),
):
    data = ParentService.send_message(
        db, student_id, payload.teacherId, payload.text, parent_id
    )
    return ApiResponse(body=data, message="success")


@router.get("/questions/{student_id}")
def get_questions(
    student_id: int, parent_id: int = Query(...), db: Session = Depends(get_db)
):
    data = ParentService.get_questions(db, student_id, parent_id)
    return ApiResponse(body=data, message="success")


@router.post("/questions/{student_id}")
def create_question(
    student_id: int,
    payload: QuestionCreate,
    parent_id: int = Query(...),
    db: Session = Depends(get_db),
):
    data = ParentService.create_question(
        db,
        student_id,
        payload.subject,
        payload.content,
        payload.priority,
        parent_id,
    )
    return ApiResponse(body=data, message="success")


@router.post("/questions/{question_id}/followup")
def add_followup(
    question_id: int,
    payload: FollowUpCreate,
    parent_id: int = Query(...),
    db: Session = Depends(get_db),
):
    data = ParentService.add_followup(db, question_id, payload.content, parent_id)
    return ApiResponse(body=data, message="success")


@router.get("/settings")
def get_settings(parent_id: int = Query(...), db: Session = Depends(get_db)):
    data = ParentService.get_settings(db, parent_id)
    return ApiResponse(body=data, message="success")


@router.put("/settings")
def update_settings(
    payload: SettingsUpdate,
    parent_id: int = Query(...),
    db: Session = Depends(get_db),
):
    data = ParentService.update_settings(
        db, payload.preferred_language, payload.notifications, parent_id
    )
    return ApiResponse(body=data, message="success")
