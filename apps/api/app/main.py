from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.admin.routes import router as admin_router
from app.auth.routes import router as auth_router
from app.database import Base, engine
from app.db_migrate import run_postgresql_migrations
from app.models import (  # noqa: F401 - register all tables for create_all
    OTP,
    AuditLog,
    PasswordResetToken,
    User,
    UserSession,
)
from app.seed_admin_service import ensure_super_admin

Base.metadata.create_all(bind=engine)
run_postgresql_migrations(engine)
ensure_super_admin()

app = FastAPI(
    title="Recruitment AI API",
    description="AI-powered recruitment system",
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


@app.get("/health")
def health():
    return {"status": "ok"}
