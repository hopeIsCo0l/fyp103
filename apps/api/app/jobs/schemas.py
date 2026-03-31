from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class PublicJobOut(BaseModel):
    """Open job visible to candidates (no internal owner id)."""

    id: str
    title: str
    description: str
    company_name: Optional[str]
    location: Optional[str]
    employment_type: str
    created_at: Optional[datetime]

    model_config = {"from_attributes": True}


class PublicJobListResponse(BaseModel):
    items: list[PublicJobOut]
    total: int
    page: int
    size: int
