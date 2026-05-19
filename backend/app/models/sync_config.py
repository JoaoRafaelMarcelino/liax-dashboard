from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from ..database import Base


class SyncConfig(Base):
    __tablename__ = "sync_config"

    id = Column(Integer, primary_key=True)
    project_name = Column(String(255), nullable=False)
    clickup_list_url = Column(String(500), nullable=False, unique=True)
    clickup_token = Column(String(255), nullable=False)
    sync_interval_minutes = Column(Integer, default=30)
    is_active = Column(Boolean, default=True)
    last_synced_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class SyncLog(Base):
    __tablename__ = "sync_log"

    id = Column(Integer, primary_key=True)
    sync_config_id = Column(Integer, ForeignKey("sync_config.id"))
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    finished_at = Column(DateTime(timezone=True))
    tasks_synced = Column(Integer, default=0)
    tasks_created = Column(Integer, default=0)
    tasks_updated = Column(Integer, default=0)
    status = Column(String(50), default="running")
    error_message = Column(Text)
