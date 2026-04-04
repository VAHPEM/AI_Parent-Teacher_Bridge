from pydantic import BaseModel
from typing import Optional


class StudentCreate(BaseModel):
    student_code: str
    name: str
    class_id: Optional[int] = None
    parent_id: Optional[int] = None
