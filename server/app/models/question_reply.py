from sqlalchemy import Column, Integer, String, ForeignKey, Text, TIMESTAMP, func
from app.db.database import Base


class QuestionReply(Base):
    __tablename__ = "question_replies"

    id          = Column(Integer, primary_key=True, autoincrement=True)
    question_id = Column(Integer, ForeignKey("parent_questions.id"), nullable=False)
    from_role   = Column(String(50), nullable=False)   # "teacher" | "parent"
    from_id     = Column(Integer)
    content     = Column(Text, nullable=False)
    created_at  = Column(TIMESTAMP, server_default=func.now())
