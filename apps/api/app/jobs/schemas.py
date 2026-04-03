from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


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


class ApplyBody(BaseModel):
    """Optional CV text for TF-IDF / cosine match vs job title + description."""

    cv_text: Optional[str] = Field(None, max_length=50000)


class CVScoreBody(BaseModel):
    """Input payload for CV scoring endpoint."""

    cv_text: str = Field(..., min_length=20, max_length=50000)


class CVScoreOut(BaseModel):
    """Model score output for one CV against one job."""

    job_id: str
    predicted_fit: str
    ranking_score: float
    prob_good: float
    prob_medium: float
    prob_bad: float
    lexical_similarity: float
    scorer_source: str
