import logging
import os
import time
import uuid

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.admin.routes import router as admin_router
from app.auth.routes import router as auth_router
from app.candidate.routes import router as candidate_router
from app.database import engine
from app.db_migrate import run_postgresql_migrations
from app.db_startup import run_alembic_upgrade, wait_for_database
from app.jobs.routes import router as jobs_router
from app.models import (  # noqa: F401 - register models for SQLAlchemy metadata
    OTP,
    AuditLog,
    Job,
    JobApplication,
    PasswordResetToken,
    User,
    UserSession,
)
from app.recruiter.routes import router as recruiter_router
from app.seed_admin_service import ensure_super_admin

if not logging.root.handlers:
    logging.basicConfig(
        level=logging.INFO,
        format="%(levelname)s %(name)s %(message)s",
    )

if not os.getenv("SKIP_STARTUP_DB"):
    wait_for_database()
    run_alembic_upgrade()
    run_postgresql_migrations(engine)
    ensure_super_admin()

_request_log = logging.getLogger("app.request")

app = FastAPI(
    title="EAA Recruit API",
    description="EAA Recruit — AI-powered recruitment platform API",
    version="1.0.0",
)

# Include 127.0.0.1 — browsers treat localhost vs 127.0.0.1 as different origins; missing entries break API calls.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(recruiter_router, prefix="/api")
app.include_router(candidate_router, prefix="/api")
app.include_router(jobs_router, prefix="/api")


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    request_id = str(uuid.uuid4())[:8]
    start = time.perf_counter()
    try:
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - start) * 1000
        _request_log.info(
            "%s %s %s %d %.1fms",
            request_id,
            request.method,
            request.url.path,
            response.status_code,
            elapsed_ms,
        )
        response.headers["X-Request-ID"] = request_id
        return response
    except HTTPException as exc:
        elapsed_ms = (time.perf_counter() - start) * 1000
        _request_log.info(
            "%s %s %s %d %.1fms",
            request_id,
            request.method,
            request.url.path,
            exc.status_code,
            elapsed_ms,
        )
        raise
    except Exception:
        elapsed_ms = (time.perf_counter() - start) * 1000
        _request_log.exception(
            "%s %s %s failed after %.1fms",
            request_id,
            request.method,
            request.url.path,
            elapsed_ms,
        )
        raise


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/ready")
def readiness():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ready", "database": "ok"}
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Database not ready") from exc
