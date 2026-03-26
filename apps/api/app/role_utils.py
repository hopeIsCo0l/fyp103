"""Role seeding and lookup by code (candidate, recruiter, admin)."""

from sqlalchemy import inspect
from sqlalchemy.orm import Session

from app.models.role import Role

ROLE_CODES = ("candidate", "recruiter", "admin")


def ensure_roles(db: Session) -> None:
    """Insert default roles if the table is empty."""
    bind = db.get_bind()
    if bind is None or not inspect(bind).has_table("roles"):
        return
    if db.query(Role).first() is not None:
        return
    for code in ROLE_CODES:
        db.add(Role(code=code))
    db.commit()


def get_role_id_by_code(db: Session, code: str) -> int:
    code = code.lower().strip()
    row = db.query(Role).filter(Role.code == code).first()
    if not row:
        raise ValueError(f"Unknown role code: {code}")
    return row.id
