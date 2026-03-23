import uuid
from sqlalchemy.orm import Session

from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_db
from app.models.user import User
from app.auth.schemas import UserSignup, UserSignin, Token, UserResponse
from app.auth.security import get_password_hash, verify_password, create_access_token
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=UserResponse)
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
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


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


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
