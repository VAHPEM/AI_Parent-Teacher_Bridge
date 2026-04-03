from fastapi import APIRouter

from app.dto.api_response import ApiResponse

router = APIRouter(prefix="/teacher", tags=["Teacher"])

@router.post("/student-record")
def create_student_record():
    pass

@router.get("/student-record/{student_id}")
def get_student_record(student_id: int):
    return ApiResponse(
        body={
            "student_id": student_id,
            "name": f"<Student ID> {student_id}",
        },
        message="success",
    )

@router.post("/generate-report/{student_id}")
def generate_report(student_id: int):
    pass