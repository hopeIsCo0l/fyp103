"""Run this script to create all database tables and run migrations."""
from sqlalchemy import text
from app.database import engine, Base
from app.models import User, OTP  # noqa: F401

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    # Migration: add is_email_verified if missing
    with engine.connect() as conn:
        if engine.url.get_backend_name() == "sqlite":
            conn.execute(text("PRAGMA table_info(users)"))
            cols = [r[1] for r in conn.execute(text("PRAGMA table_info(users)")).fetchall()]
            if "is_email_verified" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN is_email_verified BOOLEAN DEFAULT 0"))
                conn.commit()
    print("Database ready.")
