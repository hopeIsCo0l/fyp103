from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class CandidateApplicationOut(BaseModel):
    id: str
    job_id: str
    job_title: str
    company_name: Optional[str]
    stage: str
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    model_config = {"from_attributes": True}
