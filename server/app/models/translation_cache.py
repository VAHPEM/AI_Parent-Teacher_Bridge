from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, func
from app.db.database import Base


class TranslationCache(Base):
    __tablename__ = "translation_cache"

    id                 = Column(Integer, primary_key=True, autoincrement=True)
    payload_hash       = Column(String(64), nullable=False, index=True)
    language           = Column(String(10), nullable=False, index=True)
    translated_payload = Column(Text, nullable=False)
    created_at         = Column(TIMESTAMP, server_default=func.now())
