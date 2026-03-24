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


def create_and_send_otp(db: Session, email: str, purpose: str) -> bool:
    """Create OTP, invalidate previous for same email+purpose, send email. Returns True if sent."""
    email = email.lower()
    # Invalidate previous OTPs for this email+purpose
    db.query(OTP).filter(OTP.email == email, OTP.purpose == purpose).delete()
    otp = generate_otp()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
    otp_record = OTP(
        id=str(uuid.uuid4()),
        email=email,
        otp_hash=pwd_context.hash(otp),
        purpose=purpose,
        expires_at=expires_at,
    )
    db.add(otp_record)
    db.commit()
    return send_otp_email(email, otp, purpose)


def verify_otp(db: Session, email: str, otp: str, purpose: str) -> bool:
    """Verify OTP. Returns True if valid. Deletes OTP on success."""
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
    db.delete(record)
    db.commit()
    return True
