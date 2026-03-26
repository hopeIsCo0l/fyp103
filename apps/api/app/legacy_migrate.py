"""One-time migration: legacy users.role string -> users.role_id FK."""

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

from app.role_utils import ROLE_CODES, ensure_roles


def migrate_legacy_role_column(engine: Engine) -> None:
    """If users still have a string role column, add role_id, backfill, drop role."""
    inspector = inspect(engine)
    if not inspector.has_table("users"):
        return

    cols = {c["name"] for c in inspector.get_columns("users")}
    if "role_id" in cols and "role" not in cols:
        return

    backend = engine.url.get_backend_name()

    with engine.begin() as conn:
        if not inspector.has_table("roles"):
            if backend == "postgresql":
                conn.execute(
                    text(
                        """
                        CREATE TABLE roles (
                            id SERIAL PRIMARY KEY,
                            code VARCHAR(50) NOT NULL UNIQUE
                        )
                        """
                    )
                )
            else:
                conn.execute(
                    text(
                        """
                        CREATE TABLE roles (
                            id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                            code VARCHAR(50) NOT NULL UNIQUE
                        )
                        """
                    )
                )

        rcount = conn.execute(text("SELECT COUNT(*) FROM roles")).scalar()
        if rcount == 0:
            for code in ROLE_CODES:
                conn.execute(text("INSERT INTO roles (code) VALUES (:c)"), {"c": code})

        if "role_id" not in cols:
            if backend == "postgresql":
                conn.execute(text("ALTER TABLE users ADD COLUMN role_id INTEGER"))
            else:
                conn.execute(text("ALTER TABLE users ADD COLUMN role_id INTEGER"))

        if "role" in cols:
            conn.execute(
                text(
                    """
                    UPDATE users SET role_id = (
                        SELECT id FROM roles WHERE lower(roles.code) = lower(users.role)
                    )
                    WHERE role_id IS NULL
                    """
                )
            )
            conn.execute(
                text(
                    """
                    UPDATE users SET role_id = (SELECT id FROM roles WHERE code = 'candidate')
                    WHERE role_id IS NULL
                    """
                )
            )

            if backend == "postgresql":
                conn.execute(text("ALTER TABLE users ALTER COLUMN role_id SET NOT NULL"))
                conn.execute(
                    text(
                        "ALTER TABLE users ADD CONSTRAINT fk_users_role_id "
                        "FOREIGN KEY (role_id) REFERENCES roles(id)"
                    )
                )
                conn.execute(text("ALTER TABLE users DROP COLUMN role"))
            else:
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_users_role_id ON users(role_id)"))
                # SQLite 3.35+ DROP COLUMN
                try:
                    conn.execute(text("ALTER TABLE users DROP COLUMN role"))
                except Exception:
                    # Older SQLite without DROP COLUMN: leave orphan column; ORM ignores it.
                    pass


def run_post_create_all(engine, SessionLocal) -> None:
    """After Base.metadata.create_all: migrate legacy role column and seed roles."""
    migrate_legacy_role_column(engine)
    db = SessionLocal()
    try:
        ensure_roles(db)
    finally:
        db.close()
