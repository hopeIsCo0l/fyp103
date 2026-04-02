import csv
import io
import secrets
import uuid
from datetime import date as date_type
from datetime import datetime, timezone
from datetime import time as dt_time
from typing import Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query, Request, status
from fastapi.responses import Response
from sqlalchemy import func as sa_func
from sqlalchemy.orm import Session

from app.admin.schemas import (
    AdminCreateUser,
    AdminResetPassword,
    AdminResetPasswordResponse,
    AdminUpdateUser,
    AuditLogListResponse,
    AuditLogOut,
    StatsResponse,
    UserListResponse,
    UserOut,
)
from app.auth.audit_service import write_audit_log
from app.auth.dependencies import require_roles, require_super_admin
from app.auth.phone_util import normalize_phone
from app.auth.security import get_password_hash
from app.database import get_db
from app.models.audit_log import AuditLog
from app.models.user import User
from app.models.user_session import UserSession

router = APIRouter(prefix="/admin", tags=["admin"])

_admin_dep = require_roles("admin")


def _is_admin_role(user: User) -> bool:
    return user.role.lower() == "admin"


def _require_super(admin: User) -> None:
    if not admin.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required",
        )


# ── Users ────────────────────────────────────────────────────────────────


def _users_base_query(
    db: Session,
    search: str = "",
    role: str = "",
    verified: Optional[bool] = None,
):
    q = db.query(User)
    if search:
        pattern = f"%{search.lower()}%"
        q = q.filter((User.email.ilike(pattern)) | (User.full_name.ilike(pattern)))
    if role:
        q = q.filter(User.role == role.lower())
    if verified is not None:
        q = q.filter(User.is_email_verified.is_(verified))
    return q


@router.get("/users", response_model=UserListResponse)
def list_users(
    search: str = Query("", max_length=200),
    role: str = Query("", max_length=50),
    verified: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    _admin: User = Depends(_admin_dep),
    db: Session = Depends(get_db),
):
    q = _users_base_query(db, search, role, verified)
    total = q.count()
    items = q.order_by(User.created_at.desc()).offset((page - 1) * size).limit(size).all()
    return UserListResponse(
        items=[UserOut.model_validate(u) for u in items],
        total=total,
        page=page,
        size=size,
    )


@router.get("/users/export")
def export_users_csv(
    search: str = Query("", max_length=200),
    role: str = Query("", max_length=50),
    verified: Optional[bool] = Query(None),
    _super: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    q = _users_base_query(db, search, role, verified)
    rows = q.order_by(User.created_at.desc()).limit(10000).all()
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(
        [
            "id",
            "email",
            "phone",
            "full_name",
            "role",
            "is_active",
            "is_email_verified",
            "last_login_at",
            "created_at",
            "failed_login_attempts",
            "locked_until",
        ]
    )
    for u in rows:
        writer.writerow(
            [
                u.id,
                u.email,
                u.phone or "",
                u.full_name,
                u.role,
                u.is_active,
                u.is_email_verified,
                u.last_login_at.isoformat() if u.last_login_at else "",
                u.created_at.isoformat() if u.created_at else "",
                u.failed_login_attempts or 0,
                u.locked_until.isoformat() if u.locked_until else "",
            ]
        )
    return Response(
        content="\ufeff" + buf.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="users.csv"'},
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
    phone_norm = normalize_phone(payload.phone)
    if phone_norm:
        if db.query(User).filter(User.phone == phone_norm).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number already registered",
            )
    if payload.role.lower() == "admin":
        _require_super(admin)
    user = User(
        id=str(uuid.uuid4()),
        email=payload.email.lower(),
        phone=phone_norm,
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name.strip(),
        role=payload.role.lower(),
        is_email_verified=True,
        is_active=True,
        is_super_admin=False,
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
    if _is_admin_role(user):
        _require_super(admin)
    if payload.role is not None and payload.role.lower() == "admin" and not _is_admin_role(user):
        _require_super(admin)
    if payload.is_super_admin is not None:
        _require_super(admin)
        if user.id == admin.id and payload.is_super_admin is False:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot remove your own super admin status",
            )
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
        user.role = payload.role.lower()
        changes["role"] = user.role
        if user.role != "admin":
            user.is_super_admin = False
            changes["is_super_admin"] = False
    if payload.is_active is not None:
        user.is_active = payload.is_active
        changes["is_active"] = user.is_active
    if payload.is_email_verified is not None:
        user.is_email_verified = payload.is_email_verified
        changes["is_email_verified"] = user.is_email_verified
    if payload.is_super_admin is not None:
        user.is_super_admin = payload.is_super_admin
        changes["is_super_admin"] = user.is_super_admin
    if payload.full_name is not None:
        user.full_name = payload.full_name.strip()
        changes["full_name"] = user.full_name
    if payload.phone is not None:
        pn = normalize_phone(payload.phone)
        if pn and (db.query(User).filter(User.phone == pn, User.id != user_id).first()):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number already registered",
            )
        user.phone = pn
        changes["phone"] = user.phone
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
    if _is_admin_role(user):
        _require_super(admin)
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


def _clear_lockout(user: User) -> None:
    user.failed_login_attempts = 0
    user.failed_login_window_started_at = None
    user.locked_until = None


@router.post("/users/{user_id}/reset-password", response_model=AdminResetPasswordResponse)
def admin_reset_password(
    user_id: str,
    request: Request,
    admin: User = Depends(_admin_dep),
    db: Session = Depends(get_db),
    payload: AdminResetPassword = Body(default_factory=AdminResetPassword),
):
    """Optional JSON body `{"new_password": "..."}` (min 8 chars); omit body to generate a random password."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if _is_admin_role(user):
        _require_super(admin)
    if user.id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot reset your own password from the admin panel",
        )
    if payload.new_password:
        if len(payload.new_password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 8 characters",
            )
        plain = payload.new_password
    else:
        plain = secrets.token_urlsafe(24)

    user.hashed_password = get_password_hash(plain)
    user.must_change_password = True
    _clear_lockout(user)
    now = datetime.now(timezone.utc)
    db.query(UserSession).filter(
        UserSession.user_id == user.id,
        UserSession.revoked.is_(False),
    ).update({"revoked": True, "revoked_at": now}, synchronize_session=False)
    db.commit()
    ip = request.client.host if request.client else None
    write_audit_log(
        db,
        action="admin.reset_password",
        actor_id=admin.id,
        target_type="user",
        target_id=user.id,
        ip_address=ip,
        user_agent=request.headers.get("user-agent"),
        metadata={},
    )
    return AdminResetPasswordResponse(
        email=user.email,
        temporary_password=plain,
    )


@router.post("/users/{user_id}/revoke-sessions", response_model=dict)
def admin_revoke_sessions(
    user_id: str,
    request: Request,
    admin: User = Depends(_admin_dep),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if _is_admin_role(user):
        _require_super(admin)
    now = datetime.now(timezone.utc)
    n = (
        db.query(UserSession)
        .filter(UserSession.user_id == user_id, UserSession.revoked.is_(False))
        .update({"revoked": True, "revoked_at": now}, synchronize_session=False)
    )
    db.commit()
    ip = request.client.host if request.client else None
    write_audit_log(
        db,
        action="admin.revoke_sessions",
        actor_id=admin.id,
        target_type="user",
        target_id=user_id,
        ip_address=ip,
        user_agent=request.headers.get("user-agent"),
        metadata={"sessions_revoked": n},
    )
    return {"message": "Sessions revoked", "sessions_revoked": n}


# ── Audit Logs ───────────────────────────────────────────────────────────


def _audit_base_query(
    db: Session,
    action: str = "",
    actor_id: str = "",
    date_from: Optional[date_type] = None,
    date_to: Optional[date_type] = None,
):
    q = db.query(AuditLog)
    if action:
        q = q.filter(AuditLog.action == action)
    if actor_id:
        q = q.filter(AuditLog.actor_id == actor_id)
    if date_from is not None:
        start = datetime.combine(date_from, dt_time.min, tzinfo=timezone.utc)
        q = q.filter(AuditLog.created_at >= start)
    if date_to is not None:
        end = datetime.combine(date_to, dt_time(23, 59, 59, 999999), tzinfo=timezone.utc)
        q = q.filter(AuditLog.created_at <= end)
    return q


def _audit_logs_with_actor_emails(db: Session, logs: list[AuditLog]) -> list[AuditLogOut]:
    actor_ids = {log.actor_id for log in logs if log.actor_id}
    email_map: dict[str, str] = {}
    if actor_ids:
        for u in db.query(User).filter(User.id.in_(actor_ids)).all():
            email_map[u.id] = u.email
    out: list[AuditLogOut] = []
    for log in logs:
        base = AuditLogOut.model_validate(log)
        out.append(base.model_copy(update={"actor_email": email_map.get(log.actor_id)}))
    return out


@router.get("/audit-logs", response_model=AuditLogListResponse)
def list_audit_logs(
    action: str = Query("", max_length=120),
    actor_id: str = Query("", max_length=36),
    date_from: Optional[date_type] = Query(None),
    date_to: Optional[date_type] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    _admin: User = Depends(_admin_dep),
    db: Session = Depends(get_db),
):
    q = _audit_base_query(db, action, actor_id, date_from, date_to)
    total = q.count()
    items = q.order_by(AuditLog.created_at.desc()).offset((page - 1) * size).limit(size).all()
    return AuditLogListResponse(
        items=_audit_logs_with_actor_emails(db, items),
        total=total,
        page=page,
        size=size,
    )


@router.get("/audit-logs/export")
def export_audit_logs_csv(
    action: str = Query("", max_length=120),
    actor_id: str = Query("", max_length=36),
    date_from: Optional[date_type] = Query(None),
    date_to: Optional[date_type] = Query(None),
    _super: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    q = _audit_base_query(db, action, actor_id, date_from, date_to)
    rows = q.order_by(AuditLog.created_at.desc()).limit(10000).all()
    rows = _audit_logs_with_actor_emails(db, rows)
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(
        [
            "id",
            "created_at",
            "action",
            "actor_id",
            "actor_email",
            "target_type",
            "target_id",
            "ip_address",
            "metadata_json",
        ]
    )
    for log in rows:
        writer.writerow(
            [
                log.id,
                log.created_at.isoformat() if log.created_at else "",
                log.action,
                log.actor_id or "",
                log.actor_email or "",
                log.target_type or "",
                log.target_id or "",
                log.ip_address or "",
                log.metadata_json or "",
            ]
        )
    return Response(
        content="\ufeff" + buf.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="audit-logs.csv"'},
    )


# ── Stats ────────────────────────────────────────────────────────────────


@router.get("/stats", response_model=StatsResponse)
def get_stats(
    _admin: User = Depends(_admin_dep),
    db: Session = Depends(get_db),
):
    total = db.query(sa_func.count(User.id)).scalar() or 0
    candidates = db.query(sa_func.count(User.id)).filter(User.role == "candidate").scalar() or 0
    recruiters = db.query(sa_func.count(User.id)).filter(User.role == "recruiter").scalar() or 0
    admins = db.query(sa_func.count(User.id)).filter(User.role == "admin").scalar() or 0
    verified = (
        db.query(sa_func.count(User.id)).filter(User.is_email_verified.is_(True)).scalar() or 0
    )
    active_sessions = (
        db.query(sa_func.count(UserSession.id)).filter(UserSession.revoked.is_(False)).scalar() or 0
    )
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    signups_today = (
        db.query(sa_func.count(User.id)).filter(User.created_at >= today_start).scalar() or 0
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
