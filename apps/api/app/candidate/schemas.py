from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class CvExtractOut(BaseModel):
    """Response from automated CV / resume text extraction."""

    cv_text: str = Field(..., max_length=50000)
    file_format: str = Field(..., description="Detected file kind: pdf, docx, or txt")


class CandidateApplicationOut(BaseModel):
    id: str
    job_id: str
    job_title: str
    company_name: Optional[str]
    stage: str
    cv_similarity_score: Optional[float] = None
    weighted_total_score: Optional[float] = None
    score_breakdown: Optional[dict] = None
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    model_config = {"from_attributes": True}
