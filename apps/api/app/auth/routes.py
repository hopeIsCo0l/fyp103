import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.auth.otp_service import create_and_send_otp, verify_otp
from app.auth.schemas import (
    RequestOTP,
    Token,
    UserResponse,
    UserSignin,
    UserSignup,
    VerifyOTP,
)
from app.auth.security import create_access_token, get_password_hash, verify_password
from app.database import get_db
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=dict)
def signup(
    payload: UserSignup,
    db: Session = Depends(get_db),
):
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    role = payload.role.lower()
    if role not in ("candidate", "recruiter"):
        role = "candidate"
    user = User(
        id=str(uuid.uuid4()),
        email=payload.email.lower(),
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name.strip(),
        role=role,
        is_email_verified=False,
    )
    db.add(user)
    db.commit()
    if not create_and_send_otp(db, payload.email, "signup"):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to send email. Check backend console for details.",
        )
    return {"message": "OTP sent to your email", "email": payload.email.lower()}


@router.post("/verify-email", response_model=dict)
def verify_email(
    payload: VerifyOTP,
    db: Session = Depends(get_db),
):
    if not verify_otp(db, payload.email, payload.otp, "signup"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP",
        )
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.is_email_verified = True
    db.commit()
    db.refresh(user)
    token = create_access_token(data={"sub": user.id})
    return {
        "user": UserResponse.model_validate(user),
        "access_token": token,
        "token_type": "bearer",
    }


@router.post("/signin", response_model=Token)
def signin(
    payload: UserSignin,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )
    token = create_access_token(data={"sub": user.id})
    return Token(access_token=token, token_type="bearer")


@router.post("/resend-otp", response_model=dict)
def resend_otp(
    payload: RequestOTP,
    db: Session = Depends(get_db),
):
    """Resend OTP for signup verification (user must exist from signup step)."""
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
    return {"message": "OTP sent"}


@router.post("/request-login-otp", response_model=dict)
def request_login_otp(
    payload: RequestOTP,
    db: Session = Depends(get_db),
):
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
    return {"message": "OTP sent to your email"}


@router.post("/verify-login-otp", response_model=Token)
def verify_login_otp(
    payload: VerifyOTP,
    db: Session = Depends(get_db),
):
    if not verify_otp(db, payload.email, payload.otp, "login"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP",
        )
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    token = create_access_token(data={"sub": user.id})
    return Token(access_token=token, token_type="bearer")


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
