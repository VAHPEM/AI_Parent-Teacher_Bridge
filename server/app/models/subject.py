from sqlalchemy import Column, Integer, String, TIMESTAMP, func
from app.db.database import Base


class Subject(Base):
    __tablename__ = "subjects"

    id           = Column(Integer, primary_key=True, autoincrement=True)
    subject_name = Column(String(100), nullable=False, unique=True)
    created_at   = Column(TIMESTAMP, server_default=func.now())
