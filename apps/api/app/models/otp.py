from sqlalchemy import Column, DateTime, Index, String, Text
from sqlalchemy.sql import func

from app.database import Base


class OTP(Base):
    __tablename__ = "otps"

    id = Column(String(36), primary_key=True, index=True)
    email = Column(String(255), nullable=False, index=True)
    otp_hash = Column(String(255), nullable=False)
    purpose = Column(String(50), nullable=False)  # signup, login
    signup_data = Column(Text, nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (Index("ix_otp_email_purpose", "email", "purpose"),)
