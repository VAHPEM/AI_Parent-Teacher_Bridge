from sqlalchemy import Column, Integer, String, ForeignKey, TIMESTAMP, func
from app.db.database import Base


class Class(Base):
    __tablename__ = "classes"

    id          = Column(Integer, primary_key=True, autoincrement=True)
    name        = Column(String(100), nullable=False)
    grade_level = Column(String(50))
    teacher_id  = Column(Integer, ForeignKey("teachers.id"))
    created_at  = Column(TIMESTAMP, server_default=func.now())
