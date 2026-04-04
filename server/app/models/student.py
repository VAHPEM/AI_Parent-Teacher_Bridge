from sqlalchemy import Column, Integer, String, ForeignKey, TIMESTAMP, func
from app.db.database import Base


class Student(Base):
    __tablename__ = "students"

    id           = Column(Integer, primary_key=True, autoincrement=True)
    student_code = Column(String(50), unique=True)
    name         = Column(String(255), nullable=False)
    class_id     = Column(Integer, ForeignKey("classes.id"), nullable=True)
    class_name   = Column(String(50))
    grade_level  = Column(String(20))
    parent_id    = Column(Integer, ForeignKey("parents.id"))
    created_at   = Column(TIMESTAMP, server_default=func.now())
