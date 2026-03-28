"""Run this script to create all database tables and run migrations."""
from app.database import Base, engine
from app.db_migrate import run_postgresql_migrations
from app.models import OTP, AuditLog, PasswordResetToken, User, UserSession  # noqa: F401

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    run_postgresql_migrations(engine)
    print("Database ready.")
