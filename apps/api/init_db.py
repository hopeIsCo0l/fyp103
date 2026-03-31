"""Apply Alembic migrations and legacy PostgreSQL patches (init DB)."""

from app.database import engine
from app.db_migrate import run_postgresql_migrations
from app.db_startup import run_alembic_upgrade
from app.models import OTP, AuditLog, Job, PasswordResetToken, User, UserSession  # noqa: F401

if __name__ == "__main__":
    run_alembic_upgrade()
    run_postgresql_migrations(engine)
    print("Database ready.")
