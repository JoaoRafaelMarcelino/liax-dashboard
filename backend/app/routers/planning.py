from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from ..database import get_db
from ..models.planning_goal import PlanningGoal
from ..models.user import User
from ..services.auth_service import get_current_user, require_admin

router = APIRouter(prefix="/planning", tags=["planning"])


class PlanningGoalCreate(BaseModel):
    week: str
    target_migrations: int


class PlanningGoalUpdate(BaseModel):
    target_migrations: int


class PlanningGoalResponse(BaseModel):
    id: int
    week: str
    target_migrations: int
    created_at: str
    updated_at: str


def _to_dict(goal: PlanningGoal) -> dict:
    return {
        "id": goal.id,
        "week": goal.week,
        "target_migrations": goal.target_migrations,
        "created_at": goal.created_at.isoformat() if goal.created_at else None,
        "updated_at": goal.updated_at.isoformat() if goal.updated_at else None,
    }


@router.get("", response_model=List[PlanningGoalResponse])
def list_goals(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    goals = db.query(PlanningGoal).order_by(PlanningGoal.week.desc()).all()
    return [_to_dict(g) for g in goals]


@router.get("/{week}", response_model=PlanningGoalResponse)
def get_goal(
    week: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    goal = db.query(PlanningGoal).filter(PlanningGoal.week == week).first()
    if goal is None:
        raise HTTPException(status_code=404, detail="Planning goal not found")
    return _to_dict(goal)


@router.post("", response_model=PlanningGoalResponse)
def create_goal(
    body: PlanningGoalCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    existing = db.query(PlanningGoal).filter(PlanningGoal.week == body.week).first()
    if existing:
        raise HTTPException(status_code=400, detail="Planning goal for this week already exists")

    goal = PlanningGoal(week=body.week, target_migrations=body.target_migrations)
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return _to_dict(goal)


@router.put("/{week}", response_model=PlanningGoalResponse)
def update_goal(
    week: str,
    body: PlanningGoalUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    goal = db.query(PlanningGoal).filter(PlanningGoal.week == week).first()
    if goal is None:
        raise HTTPException(status_code=404, detail="Planning goal not found")

    goal.target_migrations = body.target_migrations
    db.commit()
    db.refresh(goal)
    return _to_dict(goal)


@router.delete("/{week}")
def delete_goal(
    week: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    goal = db.query(PlanningGoal).filter(PlanningGoal.week == week).first()
    if goal is None:
        raise HTTPException(status_code=404, detail="Planning goal not found")
    
    db.delete(goal)
    db.commit()
    return {"message": "Planning goal deleted"}
