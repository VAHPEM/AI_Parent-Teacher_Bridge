from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP, func
from sqlalchemy.dialects.postgresql import JSONB
from app.db.database import Base


class Parent(Base):
    __tablename__ = "parents"

    id                 = Column(Integer, primary_key=True, autoincrement=True)
    name               = Column(String(255), nullable=False)
    email              = Column(String(255), unique=True)
    phone              = Column(String(50))
    preferred_language = Column(String(20), default="en")
    prefers_voice      = Column(Boolean, default=False)
    notifications      = Column(JSONB, default={})
    created_at         = Column(TIMESTAMP, server_default=func.now())
