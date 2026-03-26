import secrets
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.auth.audit_service import write_audit_log
from app.auth.dependencies import get_current_user, require_roles
from app.auth.otp_service import create_and_send_otp, verify_otp
from app.auth.rate_limit import enforce_rate_limit
from app.auth.schemas import (
    ForgotPasswordRequest,
    RefreshTokenRequest,
    RequestOTP,
    ResetPasswordRequest,
    Token,
    UserResponse,
    UserSignin,
    UserSignup,
    VerifyOTP,
)
from app.auth.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    hash_token,
    verify_password,
)
from app.config import settings
from app.database import get_db
from app.models.password_reset_token import PasswordResetToken
from app.models.user import User
from app.models.user_session import UserSession

router = APIRouter(prefix="/auth", tags=["auth"])


def _request_context(request: Request) -> tuple[str | None, str | None]:
    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")
    return ip, ua


def _is_locked(user: User) -> bool:
    if not user.locked_until:
        return False
    locked_until = user.locked_until
    if locked_until.tzinfo is None:
        locked_until = locked_until.replace(tzinfo=timezone.utc)
    return datetime.now(timezone.utc) < locked_until


def _reset_failed_attempts(user: User) -> None:
    user.failed_login_attempts = 0
    user.failed_login_window_started_at = None
    user.locked_until = None


def _register_failed_signin(user: User) -> None:
    now = datetime.now(timezone.utc)
    window_start = user.failed_login_window_started_at
    if window_start is not None and window_start.tzinfo is None:
        window_start = window_start.replace(tzinfo=timezone.utc)
    if (window_start is None) or (
        now - window_start > timedelta(minutes=settings.SIGNIN_ATTEMPT_WINDOW_MINUTES)
    ):
        user.failed_login_window_started_at = now
        user.failed_login_attempts = 0
    user.failed_login_attempts = int(user.failed_login_attempts or 0) + 1
    if user.failed_login_attempts >= settings.SIGNIN_MAX_ATTEMPTS:
        user.locked_until = now + timedelta(minutes=settings.SIGNIN_LOCK_MINUTES)


def _issue_session_tokens(
    db: Session, user: User, request: Request
) -> tuple[str, str]:
    access_token = create_access_token(data={"sub": user.id})
    refresh_token, _ = create_refresh_token(user.id)
    ip, ua = _request_context(request)
    db.add(
        UserSession(
            id=str(uuid.uuid4()),
            user_id=user.id,
            refresh_token_hash=hash_token(refresh_token),
            expires_at=datetime.now(timezone.utc)
            + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
            user_agent=ua,
            ip_address=ip,
        )
    )
    return access_token, refresh_token


@router.post("/signup", response_model=dict)
def signup(
    payload: UserSignup,
    request: Request,
    db: Session = Depends(get_db),
):
    enforce_rate_limit(
        f"signup:{payload.email.lower()}",
        max_attempts=5,
        period_seconds=60 * 60,
        error_message="Too many signup attempts. Try again in an hour.",
    )
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    phone_norm = None
    if payload.phone and payload.phone.strip():
        phone_norm = payload.phone.strip()
        if db.query(User).filter(User.phone == phone_norm).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone already registered",
            )
    role = "candidate"
    user = User(
        id=str(uuid.uuid4()),
        email=payload.email.lower(),
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name.strip(),
        role=role,
        is_email_verified=False,
        phone=phone_norm,
    )
    db.add(user)
    db.commit()
    ip, ua = _request_context(request)
    write_audit_log(
        db,
        action="auth.signup",
        actor_id=user.id,
        target_type="user",
        target_id=user.id,
        ip_address=ip,
        user_agent=ua,
    )
    if not create_and_send_otp(db, payload.email, "signup"):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to send email. Check backend console for details.",
        )
    return {"message": "OTP sent to your email", "email": payload.email.lower()}


@router.post("/verify-email", response_model=dict)
def verify_email(
    payload: VerifyOTP,
    request: Request,
    db: Session = Depends(get_db),
):
    enforce_rate_limit(
        f"verify-email:{payload.email.lower()}",
        max_attempts=settings.OTP_MAX_ATTEMPTS_PER_HOUR,
        period_seconds=60 * 60,
        error_message="Too many OTP verification attempts. Try again later.",
    )
    if not verify_otp(db, payload.email, payload.otp, "signup"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP",
        )
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.is_email_verified = True
    user.last_login_at = datetime.now(timezone.utc)
    access_token, refresh_token = _issue_session_tokens(db, user, request)
    db.commit()
    ip, ua = _request_context(request)
    write_audit_log(
        db,
        action="auth.verify_email",
        actor_id=user.id,
        target_type="user",
        target_id=user.id,
        ip_address=ip,
        user_agent=ua,
    )
    return {
        "user": UserResponse.model_validate(user),
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.post("/signin", response_model=Token)
def signin(
    payload: UserSignin,
    request: Request,
    db: Session = Depends(get_db),
):
    ip, ua = _request_context(request)
    enforce_rate_limit(
        f"signin-ip:{ip}",
        max_attempts=30,
        period_seconds=60 * 60,
        error_message="Too many sign-in requests from this IP. Try again later.",
    )
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    if _is_locked(user):
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail="Account is temporarily locked. Please try again later.",
        )
    if not verify_password(payload.password, user.hashed_password):
        _register_failed_signin(user)
        db.commit()
        write_audit_log(
            db,
            action="auth.signin_failed",
            actor_id=user.id,
            target_type="user",
            target_id=user.id,
            ip_address=ip,
            user_agent=ua,
            metadata={"failed_attempts": user.failed_login_attempts},
        )
        if user.locked_until is not None and user.failed_login_attempts >= settings.SIGNIN_MAX_ATTEMPTS:
            lu = user.locked_until
            if lu.tzinfo is None:
                lu = lu.replace(tzinfo=timezone.utc)
            write_audit_log(
                db,
                action="auth.locked",
                actor_id=user.id,
                target_type="user",
                target_id=user.id,
                ip_address=ip,
                user_agent=ua,
                metadata={"locked_until": lu.isoformat()},
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )
    _reset_failed_attempts(user)
    user.last_login_at = datetime.now(timezone.utc)
    access_token, refresh_token = _issue_session_tokens(db, user, request)
    db.commit()
    write_audit_log(
        db,
        action="auth.signin_success",
        actor_id=user.id,
        target_type="user",
        target_id=user.id,
        ip_address=ip,
        user_agent=ua,
    )
    return Token(access_token=access_token, refresh_token=refresh_token, token_type="bearer")


@router.post("/resend-otp", response_model=dict)
def resend_otp(
    payload: RequestOTP,
    request: Request,
    db: Session = Depends(get_db),
):
    """Resend OTP for signup verification (user must exist from signup step)."""
    enforce_rate_limit(
        f"resend-otp:{payload.email.lower()}",
        max_attempts=3,
        period_seconds=60 * 60,
        error_message="Too many OTP resend attempts. Try again later.",
    )
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already verified",
        )
    if not create_and_send_otp(db, payload.email, "signup"):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to send email. Check backend console for details.",
        )
    ip, ua = _request_context(request)
    write_audit_log(
        db,
        action="auth.resend_otp",
        actor_id=user.id,
        target_type="user",
        target_id=user.id,
        ip_address=ip,
        user_agent=ua,
    )
    return {"message": "OTP sent"}


@router.post("/request-login-otp", response_model=dict)
def request_login_otp(
    payload: RequestOTP,
    request: Request,
    db: Session = Depends(get_db),
):
    enforce_rate_limit(
        f"request-login-otp:{payload.email.lower()}",
        max_attempts=settings.OTP_MAX_ATTEMPTS_PER_HOUR,
        period_seconds=60 * 60,
        error_message="Too many OTP requests. Try again later.",
    )
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found for this email",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )
    if not create_and_send_otp(db, payload.email, "login"):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to send email. Check backend console for details.",
        )
    ip, ua = _request_context(request)
    write_audit_log(
        db,
        action="auth.request_login_otp",
        actor_id=user.id,
        target_type="user",
        target_id=user.id,
        ip_address=ip,
        user_agent=ua,
    )
    return {"message": "OTP sent to your email"}


@router.post("/verify-login-otp", response_model=Token)
def verify_login_otp(
    payload: VerifyOTP,
    request: Request,
    db: Session = Depends(get_db),
):
    enforce_rate_limit(
        f"verify-login-otp:{payload.email.lower()}",
        max_attempts=settings.OTP_MAX_ATTEMPTS_PER_HOUR,
        period_seconds=60 * 60,
        error_message="Too many OTP verification attempts. Try again later.",
    )
    if not verify_otp(db, payload.email, payload.otp, "login"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP",
        )
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    user.last_login_at = datetime.now(timezone.utc)
    access_token, refresh_token = _issue_session_tokens(db, user, request)
    db.commit()
    ip, ua = _request_context(request)
    write_audit_log(
        db,
        action="auth.verify_login_otp",
        actor_id=user.id,
        target_type="user",
        target_id=user.id,
        ip_address=ip,
        user_agent=ua,
    )
    return Token(access_token=access_token, refresh_token=refresh_token, token_type="bearer")


@router.post("/refresh", response_model=Token)
def refresh_token(payload: RefreshTokenRequest, request: Request, db: Session = Depends(get_db)):
    raw = payload.refresh_token
    token_payload = decode_token(raw)
    if not token_payload or token_payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )
    session = (
        db.query(UserSession)
        .filter(UserSession.refresh_token_hash == hash_token(raw), UserSession.revoked.is_(False))
        .first()
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )
    expires = session.expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > expires:
        session.revoked = True
        session.revoked_at = datetime.now(timezone.utc)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired"
        )
    user = db.query(User).filter(User.id == session.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    session.revoked = True
    session.revoked_at = datetime.now(timezone.utc)
    access_token, new_refresh_token = _issue_session_tokens(db, user, request)
    db.commit()
    ip, ua = _request_context(request)
    write_audit_log(
        db,
        action="auth.refresh",
        actor_id=user.id,
        target_type="session",
        target_id=session.id,
        ip_address=ip,
        user_agent=ua,
    )
    return Token(
        access_token=access_token, refresh_token=new_refresh_token, token_type="bearer"
    )


@router.post("/forgot-password", response_model=dict)
def forgot_password(
    payload: ForgotPasswordRequest, request: Request, db: Session = Depends(get_db)
):
    enforce_rate_limit(
        f"forgot-password:{payload.email.lower()}",
        max_attempts=5,
        period_seconds=60 * 60,
        error_message="Too many reset requests. Try again later.",
    )
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if user:
        raw_token = secrets.token_urlsafe(32)
        db.add(
            PasswordResetToken(
                id=str(uuid.uuid4()),
                user_id=user.id,
                token_hash=hash_token(raw_token),
                expires_at=datetime.now(timezone.utc)
                + timedelta(minutes=settings.PASSWORD_RESET_EXPIRE_MINUTES),
            )
        )
        db.commit()
        from app.auth.email_service import send_password_reset_email

        send_password_reset_email(user.email, raw_token)
        ip, ua = _request_context(request)
        write_audit_log(
            db,
            action="auth.forgot_password",
            actor_id=user.id,
            target_type="user",
            target_id=user.id,
            ip_address=ip,
            user_agent=ua,
        )
    # Intentionally generic response to avoid account enumeration.
    return {
        "message": "If this account exists, a password reset email was sent."
    }


@router.post("/reset-password", response_model=dict)
def reset_password(
    payload: ResetPasswordRequest, request: Request, db: Session = Depends(get_db)
):
    rec = (
        db.query(PasswordResetToken)
        .filter(PasswordResetToken.token_hash == hash_token(payload.token))
        .first()
    )
    if not rec or rec.used_at is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid reset token")
    exp = rec.expires_at
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > exp:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reset token expired")
    user = db.query(User).filter(User.id == rec.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.hashed_password = get_password_hash(payload.new_password)
    _reset_failed_attempts(user)
    rec.used_at = datetime.now(timezone.utc)
    db.query(UserSession).filter(UserSession.user_id == user.id, UserSession.revoked.is_(False)).update(
        {"revoked": True, "revoked_at": datetime.now(timezone.utc)}
    )
    db.commit()
    ip, ua = _request_context(request)
    write_audit_log(
        db,
        action="auth.reset_password",
        actor_id=user.id,
        target_type="user",
        target_id=user.id,
        ip_address=ip,
        user_agent=ua,
    )
    return {"message": "Password updated successfully"}


@router.post("/logout", response_model=dict)
def logout(payload: RefreshTokenRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = (
        db.query(UserSession)
        .filter(
            UserSession.user_id == current_user.id,
            UserSession.refresh_token_hash == hash_token(payload.refresh_token),
            UserSession.revoked.is_(False),
        )
        .first()
    )
    if session:
        session.revoked = True
        session.revoked_at = datetime.now(timezone.utc)
        db.commit()
    return {"message": "Logged out"}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/recruiter-only", response_model=dict)
def recruiter_only(_: User = Depends(require_roles("recruiter", "admin"))):
    return {"ok": True}


@router.get("/admin-only", response_model=dict)
def admin_only(_: User = Depends(require_roles("admin"))):
    return {"ok": True}
