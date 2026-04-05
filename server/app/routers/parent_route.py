from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.dto.api_response import ApiResponse
from app.services.parent_chat import (
    get_latest_approved_report_for_parent,
    parent_chat_reply,
)

router = APIRouter(prefix="/parent", tags=["Parent"])


class ParentChatBody(BaseModel):
    message: str = Field(..., min_length=1, max_length=8000)


@router.get("/report/{student_id}")
def get_report(student_id: int):
    report = get_latest_approved_report_for_parent(student_id)
    if not report:
        return ApiResponse(body=None, message="No teacher-approved report yet")
    return ApiResponse(body=report, message="success")


@router.post("/chat/{student_id}")
def parent_chat(student_id: int, body: ParentChatBody):
    try:
        reply = parent_chat_reply(student_id, body.message)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate reply: {e!s}",
        ) from e
    return ApiResponse(body={"reply": reply}, message="success")


@router.get("/activities/{student_id}")
def get_activities(student_id: int):
    pass
