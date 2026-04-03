from sqlalchemy import Column, Integer, String, TIMESTAMP, text
from app.db.database import Base


class Student(Base):
    __tablename__ = "student"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, unique=True, nullable=False, index=True)
    student_name = Column(String(255), nullable=False)
    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))