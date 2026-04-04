from sqlalchemy import Column, Integer, String, TIMESTAMP, func
from app.db.database import Base


class CanvasSyncLog(Base):
    __tablename__ = "canvas_sync_logs"

    id            = Column(Integer, primary_key=True, autoincrement=True)
    synced_at     = Column(TIMESTAMP, server_default=func.now())
    records_count = Column(Integer, default=0)
    status        = Column(String(50))
    trigger_type  = Column(String(50))
