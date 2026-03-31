from datetime import datetime
from typing import Optional

from pydantic import BaseModel


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
