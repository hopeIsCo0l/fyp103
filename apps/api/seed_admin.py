"""Seed the first super-admin user.

Reads credentials from environment variables:
    ADMIN_EMAIL    (default: admin@recruit.local)
    ADMIN_PASSWORD (default: Admin123!)
    ADMIN_NAME     (default: Super Admin)

Skips silently if the admin already exists.

Usage:
    cd apps/api
    python seed_admin.py
"""

import os
import uuid

from app.auth.security import get_password_hash
from app.database import Base, SessionLocal, engine
from app.legacy_migrate import run_post_create_all
from app.models import OTP, AuditLog, PasswordResetToken, User, UserSession  # noqa: F401
from app.role_utils import get_role_id_by_code

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@recruit-system.com").lower()
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Admin123!")
ADMIN_NAME = os.getenv("ADMIN_NAME", "Super Admin")


def seed():
    Base.metadata.create_all(bind=engine)
    run_post_create_all(engine, SessionLocal)
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == ADMIN_EMAIL).first()
        if existing:
            if existing.role != "admin":
                existing.role_id = get_role_id_by_code(db, "admin")
                existing.is_email_verified = True
                existing.is_active = True
                db.commit()
                print(f"Promoted existing user {ADMIN_EMAIL} to admin.")
            else:
                print(f"Admin {ADMIN_EMAIL} already exists. Skipping.")
            return

        admin = User(
            id=str(uuid.uuid4()),
            email=ADMIN_EMAIL,
            hashed_password=get_password_hash(ADMIN_PASSWORD),
            full_name=ADMIN_NAME,
            role_id=get_role_id_by_code(db, "admin"),
            is_email_verified=True,
            is_active=True,
        )
        db.add(admin)
        db.commit()
        print(f"Super admin created: {ADMIN_EMAIL}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
