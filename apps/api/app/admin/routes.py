import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func as sa_func
from sqlalchemy.orm import Session, joinedload

from app.admin.schemas import (
    AdminCreateUser,
    AdminUpdateUser,
    AuditLogListResponse,
    AuditLogOut,
    StatsResponse,
    UserListResponse,
    UserOut,
)
from app.auth.audit_service import write_audit_log
from app.auth.dependencies import require_roles
from app.auth.security import get_password_hash
from app.database import get_db
from app.models.audit_log import AuditLog
from app.models.role import Role
from app.models.user import User
from app.models.user_session import UserSession
from app.role_utils import get_role_id_by_code

router = APIRouter(prefix="/admin", tags=["admin"])

_admin_dep = require_roles("admin")


# ── Users ────────────────────────────────────────────────────────────────


@router.get("/users", response_model=UserListResponse)
def list_users(
    search: str = Query("", max_length=200),
    role: str = Query("", max_length=50),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    _admin: User = Depends(_admin_dep),
    db: Session = Depends(get_db),
):
    q = db.query(User)
    if search:
        pattern = f"%{search.lower()}%"
        q = q.filter(
            (User.email.ilike(pattern)) | (User.full_name.ilike(pattern))
        )
    if role:
        rid = db.query(Role.id).filter(Role.code == role.lower()).scalar()
        if rid is not None:
            q = q.filter(User.role_id == rid)
    total = q.count()
    items = (
        q.options(joinedload(User.role_rel))
        .order_by(User.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )
    return UserListResponse(
        items=[UserOut.model_validate(u) for u in items],
        total=total,
        page=page,
        size=size,
    )


@router.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: AdminCreateUser,
    request: Request,
    admin: User = Depends(_admin_dep),
    db: Session = Depends(get_db),
):
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    user = User(
        id=str(uuid.uuid4()),
        email=payload.email.lower(),
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name.strip(),
        role_id=get_role_id_by_code(db, payload.role.lower()),
        is_email_verified=True,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    ip = request.client.host if request.client else None
    write_audit_log(
        db,
        action="admin.create_user",
        actor_id=admin.id,
        target_type="user",
        target_id=user.id,
        ip_address=ip,
        user_agent=request.headers.get("user-agent"),
        metadata={"role": user.role},
    )
    return UserOut.model_validate(user)


@router.patch("/users/{user_id}", response_model=UserOut)
def update_user(
    user_id: str,
    payload: AdminUpdateUser,
    request: Request,
    admin: User = Depends(_admin_dep),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.id == admin.id and payload.role and payload.role != admin.role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change your own role",
        )
    if user.id == admin.id and payload.is_active is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account",
        )
    changes: dict = {}
    if payload.role is not None:
        user.role_id = get_role_id_by_code(db, payload.role.lower())
        changes["role"] = payload.role.lower()
    if payload.is_active is not None:
        user.is_active = payload.is_active
        changes["is_active"] = user.is_active
    if payload.is_email_verified is not None:
        user.is_email_verified = payload.is_email_verified
        changes["is_email_verified"] = user.is_email_verified
    if payload.full_name is not None:
        user.full_name = payload.full_name.strip()
        changes["full_name"] = user.full_name
    db.commit()
    db.refresh(user)
    ip = request.client.host if request.client else None
    write_audit_log(
        db,
        action="admin.update_user",
        actor_id=admin.id,
        target_type="user",
        target_id=user.id,
        ip_address=ip,
        user_agent=request.headers.get("user-agent"),
        metadata=changes,
    )
    return UserOut.model_validate(user)


@router.delete("/users/{user_id}", response_model=dict)
def delete_user(
    user_id: str,
    request: Request,
    admin: User = Depends(_admin_dep),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account",
        )
    user.is_active = False
    db.commit()
    ip = request.client.host if request.client else None
    write_audit_log(
        db,
        action="admin.deactivate_user",
        actor_id=admin.id,
        target_type="user",
        target_id=user.id,
        ip_address=ip,
        user_agent=request.headers.get("user-agent"),
    )
    return {"message": "User deactivated"}


# ── Audit Logs ───────────────────────────────────────────────────────────


@router.get("/audit-logs", response_model=AuditLogListResponse)
def list_audit_logs(
    action: str = Query("", max_length=120),
    actor_id: str = Query("", max_length=36),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    _admin: User = Depends(_admin_dep),
    db: Session = Depends(get_db),
):
    q = db.query(AuditLog)
    if action:
        q = q.filter(AuditLog.action == action)
    if actor_id:
        q = q.filter(AuditLog.actor_id == actor_id)
    total = q.count()
    items = q.order_by(AuditLog.created_at.desc()).offset((page - 1) * size).limit(size).all()
    return AuditLogListResponse(
        items=[AuditLogOut.model_validate(log) for log in items],
        total=total,
        page=page,
        size=size,
    )


# ── Stats ────────────────────────────────────────────────────────────────


@router.get("/stats", response_model=StatsResponse)
def get_stats(
    _admin: User = Depends(_admin_dep),
    db: Session = Depends(get_db),
):
    total = db.query(sa_func.count(User.id)).scalar() or 0
    def _count_role(code: str) -> int:
        rid = db.query(Role.id).filter(Role.code == code).scalar()
        if rid is None:
            return 0
        return db.query(sa_func.count(User.id)).filter(User.role_id == rid).scalar() or 0

    candidates = _count_role("candidate")
    recruiters = _count_role("recruiter")
    admins = _count_role("admin")
    verified = (
        db.query(sa_func.count(User.id)).filter(User.is_email_verified.is_(True)).scalar() or 0
    )
    active_sessions = (
        db.query(sa_func.count(UserSession.id))
        .filter(UserSession.revoked.is_(False))
        .scalar()
        or 0
    )
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    signups_today = (
        db.query(sa_func.count(User.id))
        .filter(User.created_at >= today_start)
        .scalar()
        or 0
    )
    return StatsResponse(
        total_users=total,
        candidates=candidates,
        recruiters=recruiters,
        admins=admins,
        verified_users=verified,
        active_sessions=active_sessions,
        signups_today=signups_today,
    )
