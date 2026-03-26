"""Run this script to create all database tables and run migrations."""
from sqlalchemy import text

from app.database import Base, engine
from app.models import AuditLog, OTP, PasswordResetToken, User, UserSession  # noqa: F401

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    # Migration: add is_email_verified if missing
    with engine.connect() as conn:
        if engine.url.get_backend_name() == "sqlite":
            cols = [r[1] for r in conn.execute(text("PRAGMA table_info(users)")).fetchall()]
            if "is_email_verified" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN is_email_verified BOOLEAN DEFAULT 0"))
            if "failed_login_attempts" not in cols:
                conn.execute(
                    text("ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0")
                )
            if "failed_login_window_started_at" not in cols:
                conn.execute(
                    text("ALTER TABLE users ADD COLUMN failed_login_window_started_at DATETIME")
                )
            if "locked_until" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN locked_until DATETIME"))
            if "last_login_at" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN last_login_at DATETIME"))
            if "phone" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN phone VARCHAR(32)"))
                conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_phone ON users(phone)"))
            conn.commit()
    print("Database ready.")
