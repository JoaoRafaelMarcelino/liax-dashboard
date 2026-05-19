from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Any
from ..database import get_db
from ..models.app_config import AppConfig
from ..models.user import User
from ..services.auth_service import get_current_user, require_admin

router = APIRouter(prefix="/api/app-config", tags=["app-config"])

ALLOWED_KEYS = {"vision_tabs", "menu_visibility", "homologacao_section_visible"}

DEFAULTS: dict = {
    "vision_tabs": [],
    "menu_visibility": {},
    "homologacao_section_visible": True,
}


class ConfigBody(BaseModel):
    value: Any


@router.get("/{key}")
def get_config(key: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    if key not in ALLOWED_KEYS:
        raise HTTPException(status_code=400, detail="Config key not allowed")
    config = db.get(AppConfig, key)
    if config is None:
        return {"key": key, "value": DEFAULTS.get(key)}
    return {"key": key, "value": config.value}


@router.put("/{key}")
def update_config(
    key: str,
    body: ConfigBody,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    if key not in ALLOWED_KEYS:
        raise HTTPException(status_code=400, detail="Config key not allowed")
    config = db.get(AppConfig, key)
    if config is None:
        config = AppConfig(key=key, value=body.value)
        db.add(config)
    else:
        config.value = body.value
    db.commit()
    db.refresh(config)
    return {"key": key, "value": config.value}
