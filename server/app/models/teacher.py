from sqlalchemy import Column, Integer, String, TIMESTAMP, func
from app.db.database import Base


class Teacher(Base):
    __tablename__ = "teachers"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    name       = Column(String(255), nullable=False)
    email      = Column(String(255), unique=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
