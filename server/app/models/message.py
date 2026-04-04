from sqlalchemy import Column, Integer, String, ForeignKey, Text, TIMESTAMP, func
from app.db.database import Base


class ChatMessage(Base):
    """Parent ↔ AI chat messages (chat_messages table)."""
    __tablename__ = "chat_messages"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    parent_id  = Column(Integer, ForeignKey("parents.id"), nullable=False)
    role       = Column(String(20), nullable=False)   # "parent" | "ai"
    content    = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
