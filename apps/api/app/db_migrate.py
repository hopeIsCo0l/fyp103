"""Idempotent PostgreSQL DDL for existing DBs (create_all does not add columns)."""

import logging

from sqlalchemy import Engine, text

logger = logging.getLogger(__name__)


def migrate_users_columns_postgresql(conn) -> None:
    """Add any User model columns missing from an older `users` table."""
    rows = conn.execute(
        text(
            """
            SELECT column_name FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'users'
            """
        )
    ).fetchall()
    existing = {r[0] for r in rows}
    if not existing:
        return

    # Older schemas used FK `role_id`; the app uses string `role`. Keeping both leaves
    # role_id NOT NULL and breaks INSERTs that only set `role`.
    if "role_id" in existing:
        logger.warning("Dropping legacy users.role_id (app uses users.role string).")
        conn.execute(text("ALTER TABLE users DROP COLUMN IF EXISTS role_id CASCADE"))
        existing.discard("role_id")

    alters: list[str] = []
    if "role" not in existing:
        alters.append(
            "ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'candidate' NOT NULL"
        )
    if "is_active" not in existing:
        alters.append(
            "ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE NOT NULL"
        )
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
    if "phone" not in existing:
        alters.append("ALTER TABLE users ADD COLUMN phone VARCHAR(32)")
    if "created_at" not in existing:
        alters.append(
            "ALTER TABLE users ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL"
        )
    if "updated_at" not in existing:
        alters.append("ALTER TABLE users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE")
    for sql in alters:
        logger.warning("Applying legacy users DDL: %s", sql[:80] + ("..." if len(sql) > 80 else ""))
        conn.execute(text(sql))


def ensure_postgresql_indexes(conn) -> None:
    """Composite audit index (idempotent)."""
    conn.execute(
        text(
            "CREATE INDEX IF NOT EXISTS ix_audit_logs_created_actor_action "
            "ON audit_logs (created_at, actor_id, action)"
        )
    )


def run_postgresql_migrations(engine: Engine) -> None:
    if engine.url.get_backend_name() != "postgresql":
        return
    with engine.begin() as conn:
        migrate_users_columns_postgresql(conn)
        # audit_logs may not exist yet on first boot; skip index if table missing
        r = conn.execute(
            text(
                """
                SELECT 1 FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = 'audit_logs'
                """
            )
        ).first()
        if r:
            ensure_postgresql_indexes(conn)
