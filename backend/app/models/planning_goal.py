from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from ..database import Base


class PlanningGoal(Base):
    __tablename__ = "planning_goals"

    id = Column(Integer, primary_key=True, autoincrement=True)
    week = Column(String(10), nullable=False, unique=True)  # Formato "YYYY-Www" (ex: "2025-W01")
    target_migrations = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
