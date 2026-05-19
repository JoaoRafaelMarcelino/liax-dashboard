from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.sync_config import SyncConfig, SyncLog
from ..models.user import User
from ..schemas.sync import SyncConfigCreate, SyncConfigUpdate, SyncConfigResponse, SyncLogResponse
from ..services.auth_service import require_admin, get_current_user
from ..services import sync_scheduler
from ..services.clickup_service import sync_tasks

router = APIRouter(prefix="/api/sync", tags=["sync"])


def _config_to_dict(config: SyncConfig) -> dict:
    return {
        "id": config.id,
        "project_name": config.project_name,
        "clickup_list_url": config.clickup_list_url,
        "sync_interval_minutes": config.sync_interval_minutes,
        "is_active": config.is_active,
        "last_synced_at": config.last_synced_at.isoformat() if config.last_synced_at else None,
        "created_at": config.created_at.isoformat() if config.created_at else None,
    }


def _log_to_dict(log: SyncLog) -> dict:
    return {
        "id": log.id,
        "sync_config_id": log.sync_config_id,
        "started_at": log.started_at.isoformat() if log.started_at else None,
        "finished_at": log.finished_at.isoformat() if log.finished_at else None,
        "tasks_synced": log.tasks_synced,
        "tasks_created": log.tasks_created,
        "tasks_updated": log.tasks_updated,
        "status": log.status,
        "error_message": log.error_message,
    }


@router.get("/configs")
def list_configs(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    configs = db.query(SyncConfig).all()
    return [_config_to_dict(c) for c in configs]


@router.post("/configs", response_model=SyncConfigResponse, status_code=201)
def create_config(payload: SyncConfigCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    config = SyncConfig(**payload.model_dump())
    db.add(config)
    db.commit()
    db.refresh(config)
    sync_scheduler.reload_jobs()
    return _config_to_dict(config)


@router.put("/configs/{config_id}")
def update_config(config_id: int, payload: SyncConfigUpdate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    config = db.get(SyncConfig, config_id)
    if not config:
        raise HTTPException(status_code=404, detail="Configuração não encontrada")
    for key, val in payload.model_dump(exclude_none=True).items():
        setattr(config, key, val)
    db.commit()
    db.refresh(config)
    sync_scheduler.reload_jobs()
    return _config_to_dict(config)


@router.delete("/configs/{config_id}", status_code=204)
def delete_config(config_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    config = db.get(SyncConfig, config_id)
    if not config:
        raise HTTPException(status_code=404, detail="Configuração não encontrada")
    db.delete(config)
    db.commit()
    sync_scheduler.reload_jobs()


@router.post("/configs/{config_id}/trigger")
def trigger_sync(config_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    config = db.get(SyncConfig, config_id)
    if not config:
        raise HTTPException(status_code=404, detail="Configuração não encontrada")
    background_tasks.add_task(sync_tasks, db, config)
    return {"message": "Sincronização iniciada"}


@router.get("/logs")
def list_logs(limit: int = 50, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    logs = db.query(SyncLog).order_by(SyncLog.started_at.desc()).limit(limit).all()
    return [_log_to_dict(l) for l in logs]
