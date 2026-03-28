"""Run this script to create all database tables and run migrations."""
from sqlalchemy import text

from app.database import Base, engine
from app.models import OTP, AuditLog, PasswordResetToken, User, UserSession  # noqa: F401


def _migrate_users_columns_postgresql(conn) -> None:
    """Add legacy columns on older deployments if missing."""
    rows = conn.execute(
        text(
            """
            SELECT column_name FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'users'
            """
        )
    ).fetchall()
    existing = {r[0] for r in rows}
    alters: list[str] = []
    if "is_email_verified" not in existing:
        alters.append(
            "ALTER TABLE users ADD COLUMN is_email_verified BOOLEAN DEFAULT FALSE NOT NULL"
        )
    if "failed_login_attempts" not in existing:
        alters.append(
            "ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0 NOT NULL"
        )
    if "failed_login_window_started_at" not in existing:
        alters.append(
            "ALTER TABLE users ADD COLUMN failed_login_window_started_at TIMESTAMP WITH TIME ZONE"
        )
    if "locked_until" not in existing:
        alters.append("ALTER TABLE users ADD COLUMN locked_until TIMESTAMP WITH TIME ZONE")
    if "last_login_at" not in existing:
        alters.append("ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE")
    for sql in alters:
        conn.execute(text(sql))


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    if engine.url.get_backend_name() == "postgresql":
        with engine.begin() as conn:
            _migrate_users_columns_postgresql(conn)
    print("Database ready.")
