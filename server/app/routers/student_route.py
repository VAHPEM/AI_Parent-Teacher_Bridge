from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dto.api_response import ApiResponse
from app.exceptions.app_exception import AppException
from app.schemas.student import StudentCreate
from app.services.student_service import StudentService

router = APIRouter(prefix="/student", tags=["Student"])


@router.post("/")
def create_student(payload: StudentCreate, db: Session = Depends(get_db)):
    student = StudentService.create_student(db, payload)

    if not student:
        raise AppException(message="student_id already exists", status_code=400)
    return ApiResponse(
        body={
            "id": student.id,
            "student_id": student.student_id,
            "student_name": student.student_name
        },
        message="Student created successfully"
    )

@router.get("/{student_id}")
def get_student(student_id: int, db: Session = Depends(get_db)):
    student = StudentService.get_student_by_student_id(db, student_id)

    if not student:
        raise AppException(message="Student not found", status_code=404)

    return ApiResponse(
        message = "Student fetched successfully",
        body = {
            "id": student.id,
            "student_id": student.student_id,
            "student_name": student.student_name
        },
    )