from fastapi import FastAPI, Request
from sqlalchemy import text
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

logger = logging.getLogger(__name__)
from .database import engine
from .models import user, task, sync_config, app_config, planning_goal
from .database import Base
from .routers import auth, users, tasks, sync, dashboard, roles, app_config as app_config_router, planning
from .services import sync_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    with engine.connect() as conn:
        conn.execute(text("CREATE SCHEMA IF NOT EXISTS dashboard"))
        conn.commit()
    Base.metadata.create_all(bind=engine)
    sync_scheduler.start()
    yield
    sync_scheduler.stop()


app = FastAPI(
    title="Liax Dashboard API",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.warning(f"[REQUEST] {request.method} {request.url.path} (from {request.client.host})")
    response = await call_next(request)
    logger.warning(f"[RESPONSE] {request.method} {request.url.path} -> {response.status_code}")
    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(tasks.router)
app.include_router(sync.router)
app.include_router(dashboard.router)
app.include_router(roles.router)
app.include_router(app_config_router.router)
app.include_router(planning.router)


@app.get("/health")
def health():
    return {"status": "ok", "version": "2.0.0"}
