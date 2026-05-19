from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SyncConfigCreate(BaseModel):
    project_name: str
    clickup_list_url: str
    clickup_token: str
    sync_interval_minutes: int = 30


class SyncConfigUpdate(BaseModel):
    project_name: Optional[str] = None
    clickup_list_url: Optional[str] = None
    clickup_token: Optional[str] = None
    sync_interval_minutes: Optional[int] = None
    is_active: Optional[bool] = None


class SyncConfigResponse(BaseModel):
    id: int
    project_name: str
    clickup_list_url: str
    sync_interval_minutes: int
    is_active: bool
    last_synced_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class SyncLogResponse(BaseModel):
    id: int
    sync_config_id: Optional[int]
    started_at: datetime
    finished_at: Optional[datetime]
    tasks_synced: int
    tasks_created: int
    tasks_updated: int
    status: str
    error_message: Optional[str]

    class Config:
        from_attributes = True
