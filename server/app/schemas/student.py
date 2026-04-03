from pydantic import BaseModel


class StudentCreate(BaseModel):
    student_id: int
    student_name: str