import secrets
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.auth.email_service import send_otp_email
from app.auth.security import pwd_context
from app.config import settings
from app.models.otp import OTP


def generate_otp() -> str:
    """Generate a numeric OTP of configured length."""
    length = settings.OTP_LENGTH
    return "".join(secrets.choice("0123456789") for _ in range(length))


def create_and_send_otp(
    db: Session, email: str, purpose: str, signup_data: str | None = None
) -> bool:
    """Create OTP, invalidate previous for same email+purpose, send email. Returns True if sent."""
    email = email.lower()
    db.query(OTP).filter(OTP.email == email, OTP.purpose == purpose).delete()
    otp = generate_otp()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
    otp_record = OTP(
        id=str(uuid.uuid4()),
        email=email,
        otp_hash=pwd_context.hash(otp),
        purpose=purpose,
        signup_data=signup_data,
        expires_at=expires_at,
    )
    db.add(otp_record)
    db.commit()
    return send_otp_email(email, otp, purpose)


def verify_otp(db: Session, email: str, otp: str, purpose: str) -> dict | bool:
    """Verify OTP. Returns signup_data dict for signup purpose, True for others, False on failure."""
    email = email.lower()
    record = (
        db.query(OTP)
        .filter(OTP.email == email, OTP.purpose == purpose)
        .order_by(OTP.created_at.desc())
        .first()
    )
    if not record:
        return False
    exp = record.expires_at
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > exp:
        db.delete(record)
        db.commit()
        return False
    if not pwd_context.verify(otp, record.otp_hash):
        return False
    signup_data = record.signup_data
    db.delete(record)
    db.commit()
    if purpose == "signup" and signup_data:
        import json

        return json.loads(signup_data)
    return True
