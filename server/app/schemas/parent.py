from pydantic import BaseModel
from typing import Any, Optional


class ChildOut(BaseModel):
    id: int
    name: str
    firstName: str
    initials: str
    color: str
    year: str
    class_name: str
    teacher: str
    school: str
    overallGrade: str
    attendance: str

    class Config:
        from_attributes = True


class RecentReportOut(BaseModel):
    subject: str
    grade: str
    trend: Optional[str]
    comment: Optional[str]
    aiRecommendations: list[str]
    week: str


class DashboardOut(BaseModel):
    recentReports: list[RecentReportOut]
    recentActivity: list[dict]
    upcomingEvents: list[dict]
    aiInsight: str


class SubjectOut(BaseModel):
    name: str
    grade: str
    score: float
    trend: Optional[str]
    level: str
    levelColor: str
    levelBg: str
    curriculumRef: Optional[str]
    teacherComment: Optional[str]
    weakAreas: list[str]
    strengths: list[str]
    aiRecs: list[str]
    classAverage: float


class ProgressOut(BaseModel):
    subjects: list[SubjectOut]
    progressHistory: list[dict]


class ActivityOut(BaseModel):
    id: int
    subject: Optional[str]
    title: Optional[str]
    type: Optional[str]
    duration: Optional[str]
    difficulty: Optional[str]
    description: Optional[str]
    steps: list[str]
    questions: list[str]
    aiGenerated: bool
    curriculumRef: Optional[str]
    confidence: str
    completed: bool

    class Config:
        from_attributes = True


class MessageOut(BaseModel):
    id: Any
    from_type: str
    from_id: Optional[int]
    text: str
    created_at: Any

    class Config:
        from_attributes = True


class MessageThreadOut(BaseModel):
    teacherId: int
    teacherName: str
    messages: list[MessageOut]


class MessageCreate(BaseModel):
    teacherId: int
    text: str


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[int] = None


class ChatResponse(BaseModel):
    reply: str
    confidence: str
    sources: list[str]


class QuestionReplyOut(BaseModel):
    id: Any
    from_type: str
    from_id: Optional[int]
    content: str
    created_at: Any

    class Config:
        from_attributes = True


class QuestionOut(BaseModel):
    id: int
    subject: Optional[str]
    content: str
    priority: str
    status: str
    createdAt: Any
    aiSuggestedResponse: Optional[str]
    replies: list[QuestionReplyOut]

    class Config:
        from_attributes = True


class QuestionCreate(BaseModel):
    subject: str
    content: str
    priority: str = "general"


class FollowUpCreate(BaseModel):
    content: str


class SettingsOut(BaseModel):
    name: str
    phone: Optional[str]
    preferred_language: str
    notifications: dict

    class Config:
        from_attributes = True


class SettingsUpdate(BaseModel):
    preferred_language: Optional[str] = None
    notifications: Optional[dict] = None


class TeacherOut(BaseModel):
    id: int
    name: str
    initials: str
    subject: Optional[str]
    school: Optional[str]

    class Config:
        from_attributes = True
