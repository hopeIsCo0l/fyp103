from datetime import date

from pydantic import BaseModel, EmailStr, Field


class UserSignup(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=1, max_length=255)
    phone: str | None = Field(None, max_length=32)


class UserSignin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    refresh_token: str | None = None
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str
    exp: int


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    is_email_verified: bool = False
    is_super_admin: bool = False
    must_change_password: bool = False
    phone: str | None = None
    profile_completion_skipped: bool = False
    profile_completed: bool = True
    birth_date: date | None = None
    country: str | None = None
    city: str | None = None
    subcity: str | None = None
    address_line: str | None = None
    education_level: str | None = None
    high_school_name: str | None = None
    high_school_completion_year: int | None = None
    higher_education_institution: str | None = None
    higher_education_level: str | None = None
    field_of_study: str | None = None
    graduation_year: int | None = None
    height_cm: float | None = None
    weight_kg: float | None = None
    bmi: float | None = None
    skills_summary: str | None = None
    experience_summary: str | None = None

    class Config:
        from_attributes = True


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)


class UpdateProfileRequest(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=255)
    phone: str | None = Field(default=None, max_length=32)
    profile_completion_skipped: bool | None = None
    birth_date: date | None = None
    country: str | None = Field(default=None, max_length=100)
    city: str | None = Field(default=None, max_length=100)
    subcity: str | None = Field(default=None, max_length=100)
    address_line: str | None = Field(default=None, max_length=255)
    education_level: str | None = Field(default=None, max_length=100)
    high_school_name: str | None = Field(default=None, max_length=255)
    high_school_completion_year: int | None = Field(default=None, ge=1900, le=2100)
    higher_education_institution: str | None = Field(default=None, max_length=255)
    higher_education_level: str | None = Field(default=None, max_length=100)
    field_of_study: str | None = Field(default=None, max_length=150)
    graduation_year: int | None = Field(default=None, ge=1900, le=2100)
    height_cm: float | None = Field(default=None, gt=0, le=300)
    weight_kg: float | None = Field(default=None, gt=0, le=500)
    skills_summary: str | None = Field(default=None, max_length=2000)
    experience_summary: str | None = Field(default=None, max_length=2000)


class RequestOTP(BaseModel):
    email: EmailStr


class VerifyOTP(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=4, max_length=8)


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)
