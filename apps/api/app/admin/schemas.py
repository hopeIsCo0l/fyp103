from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class AdminCreateUser(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=1, max_length=255)
    role: str = Field(..., pattern="^(recruiter|admin)$")


class AdminUpdateUser(BaseModel):
    role: Optional[str] = Field(None, pattern="^(candidate|recruiter|admin)$")
    is_active: Optional[bool] = None
    is_email_verified: Optional[bool] = None
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)


class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    is_email_verified: bool
    last_login_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    items: list[UserOut]
    total: int
    page: int
    size: int


class AuditLogOut(BaseModel):
    id: str
    actor_id: Optional[str] = None
    action: str
    target_type: Optional[str] = None
    target_id: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    metadata_json: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AuditLogListResponse(BaseModel):
    items: list[AuditLogOut]
    total: int
    page: int
    size: int


class StatsResponse(BaseModel):
    total_users: int
    candidates: int
    recruiters: int
    admins: int
    verified_users: int
    active_sessions: int
    signups_today: int
