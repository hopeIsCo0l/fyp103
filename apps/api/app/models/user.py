from datetime import date

from sqlalchemy import Boolean, Column, Date, DateTime, Float, Integer, String, Text
from sqlalchemy.sql import func

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(32), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="candidate", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_super_admin = Column(Boolean, default=False, nullable=False)
    must_change_password = Column(Boolean, default=False, nullable=False)
    profile_completion_skipped = Column(Boolean, default=False, nullable=False)
    is_email_verified = Column(Boolean, default=False, nullable=False)
    birth_date = Column(Date, nullable=True)
    country = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    subcity = Column(String(100), nullable=True)
    address_line = Column(String(255), nullable=True)
    education_level = Column(String(100), nullable=True)
    high_school_name = Column(String(255), nullable=True)
    high_school_completion_year = Column(Integer, nullable=True)
    higher_education_institution = Column(String(255), nullable=True)
    higher_education_level = Column(String(100), nullable=True)
    field_of_study = Column(String(150), nullable=True)
    graduation_year = Column(Integer, nullable=True)
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    skills_summary = Column(Text, nullable=True)
    experience_summary = Column(Text, nullable=True)
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    failed_login_window_started_at = Column(DateTime(timezone=True), nullable=True)
    locked_until = Column(DateTime(timezone=True), nullable=True)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    @staticmethod
    def _has_text(value: str | None) -> bool:
        return bool(value and value.strip())

    @property
    def bmi(self) -> float | None:
        if not self.height_cm or not self.weight_kg or self.height_cm <= 0 or self.weight_kg <= 0:
            return None
        height_m = self.height_cm / 100
        return round(self.weight_kg / (height_m * height_m), 1)

    @property
    def profile_completed(self) -> bool:
        if (self.role or "").lower() != "candidate":
            return True
        return all(
            [
                isinstance(self.birth_date, date),
                self._has_text(self.country),
                self._has_text(self.city),
                self._has_text(self.subcity),
                self._has_text(self.education_level),
                self._has_text(self.high_school_name),
                self.high_school_completion_year is not None,
            ]
        )
