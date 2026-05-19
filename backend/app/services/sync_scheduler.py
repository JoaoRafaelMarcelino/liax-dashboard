from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy.orm import Session
from ..database import SessionLocal
from ..models.sync_config import SyncConfig
from .clickup_service import sync_tasks

scheduler = BackgroundScheduler()


def _run_sync(config_id: int):
    db: Session = SessionLocal()
    try:
        config = db.get(SyncConfig, config_id)
        if config and config.is_active:
            print(f"[Scheduler] Syncing config_id={config_id} '{config.project_name}'...")
            sync_tasks(db, config)
            print(f"[Scheduler] Done config_id={config_id}")
    except Exception as e:
        print(f"[Scheduler] Error config_id={config_id}: {e}")
    finally:
        db.close()


def reload_jobs():
    db: Session = SessionLocal()
    try:
        configs = db.query(SyncConfig).filter(SyncConfig.is_active == True).all()
        scheduler.remove_all_jobs()
        for config in configs:
            scheduler.add_job(
                _run_sync,
                trigger=IntervalTrigger(minutes=config.sync_interval_minutes),
                id=f"sync_{config.id}",
                args=[config.id],
                replace_existing=True,
            )
            print(f"[Scheduler] Registered sync job for '{config.project_name}' every {config.sync_interval_minutes}min")
    finally:
        db.close()


def start():
    reload_jobs()
    scheduler.start()
    print("[Scheduler] Started")


def stop():
    scheduler.shutdown(wait=False)
