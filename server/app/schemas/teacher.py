from pydantic import BaseModel
from typing import Any, Optional


class ClassOut(BaseModel):
    id: int
    name: str
    grade_level: Optional[str]
    teacher: str
    studentCount: int
    avgGrade: str
    trending: str

    class Config:
        from_attributes = True


class StudentListOut(BaseModel):
    id: int
    name: str
    initials: str
    color: str
    grade: str
    trend: str

    class Config:
        from_attributes = True


class GradeEntryOut(BaseModel):
    student_id: int
    name: str
    initials: str
    grade: str
    score: float
    participation: str
    comment: Optional[str]
    concerns: list[str]


class GradeEntryItem(BaseModel):
    student_id: int
    grade: Optional[str] = None
    score: Optional[float] = None
    comment: Optional[str] = None


class GradeEntrySubmit(BaseModel):
    class_id: int
    week: int
    term: str = "Term 2"
    subject: str
    entries: list[GradeEntryItem]


class AIAnalysisOut(BaseModel):
    id: int
    avatar: str
    avatarColor: str
    student: str
    year: Optional[str]
    subject: Optional[str]
    status: str
    confidence: str
    weakAreas: list[str]
    recommendations: list[str]
    curriculumRef: Optional[str]
    practicePreview: Optional[str]
    timestamp: Optional[str]

    class Config:
        from_attributes = True


class FlaggedQuestionOut(BaseModel):
    id: int
    avatar: str
    avatarColor: str
    parentName: str
    childName: str
    studentName: str
    priority: str
    status: str
    subject: Optional[str]
    question: str
    aiSuggestedResponse: Optional[str]
    flagReason: Optional[str]
    flagIcon: Optional[str]
    timestamp: Optional[str]
    createdAt: Any

    class Config:
        from_attributes = True


class RespondCreate(BaseModel):
    response: str
    method: str = "ai"


class ReportOut(BaseModel):
    id: int
    title: Optional[str]
    class_name: Optional[str]
    term: Optional[str]
    week_number: Optional[int]
    status: str
    studentCount: Optional[int]
    generatedAt: Optional[Any]
    sentAt: Optional[Any]

    class Config:
        from_attributes = True
