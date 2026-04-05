from sqlalchemy import Column, Integer, String, ForeignKey, TIMESTAMP, func
from app.db.database import Base


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    parent_id  = Column(Integer, ForeignKey("parents.id"), nullable=False)
    title      = Column(String(255))
    language   = Column(String(20), default="en")
    created_at = Column(TIMESTAMP, server_default=func.now())
