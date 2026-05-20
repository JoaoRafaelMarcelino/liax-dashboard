from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, selectinload
from typing import List, Optional
from ..database import get_db
from ..models.task import Task
from ..models.user import User
from ..schemas.task import TaskOut
from ..services.auth_service import get_current_user

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("/", response_model=List[TaskOut])
def list_tasks(
    custom_item_id: Optional[int] = Query(None),
    status_name: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Task).options(
        selectinload(Task.assignees),
        selectinload(Task.dev_back),
        selectinload(Task.dev_front),
        selectinload(Task.tags),
    )
    if custom_item_id is not None:
        q = q.filter(Task.custom_item_id == custom_item_id)
    if status_name:
        q = q.filter(Task.status_name.ilike(f"%{status_name}%"))
    if search:
        q = q.filter(Task.name.ilike(f"%{search}%"))
    return q.order_by(Task.status_orderindex.asc().nullsfirst(), Task.date_created.desc()).all()


@router.get("/statuses")
def list_statuses(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    from sqlalchemy import distinct, func
    rows = db.query(Task.status_name, Task.status_color, Task.status_orderindex).distinct().filter(Task.status_name != None).all()
    statuses = [{"status": r[0], "color": r[1], "orderindex": r[2]} for r in rows]
    return sorted(statuses, key=lambda x: (x["orderindex"] or 999))


@router.get("/collaborators")
def list_collaborators(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    from ..models.task import ClickupUser, TaskAssignee
    from sqlalchemy import func
    rows = (
        db.query(ClickupUser)
        .join(TaskAssignee, TaskAssignee.user_id == ClickupUser.id)
        .distinct()
        .all()
    )
    return [{"id": u.id, "username": u.username, "email": u.email} for u in rows]
