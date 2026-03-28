"""Idempotent super-admin ensure (create or promote by ADMIN_EMAIL)."""

import os
import uuid

from sqlalchemy.orm import Session

from app.auth.security import get_password_hash
from app.database import SessionLocal
from app.models.user import User


def ensure_super_admin() -> None:
    """Create or promote the configured admin user. Safe to call on every startup."""
    email = os.getenv("ADMIN_EMAIL", "admin@recruit-system.com").lower()
    password = os.getenv("ADMIN_PASSWORD", "Admin123!")
    name = os.getenv("ADMIN_NAME", "Super Admin")

    db: Session = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            changed = False
            if existing.role != "admin":
                existing.role = "admin"
                changed = True
            if not existing.is_email_verified:
                existing.is_email_verified = True
                changed = True
            if not existing.is_active:
                existing.is_active = True
                changed = True
            if changed:
                db.commit()
            return

        db.add(
            User(
                id=str(uuid.uuid4()),
                email=email,
                hashed_password=get_password_hash(password),
                full_name=name,
                role="admin",
                is_email_verified=True,
                is_active=True,
            )
        )
        db.commit()
    finally:
        db.close()
