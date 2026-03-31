from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field
from recruit_database import CriteriaWeights

EmploymentType = Literal["full_time", "part_time", "contract", "internship"]
JobStatus = Literal["draft", "open", "paused", "closed"]


class JobCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str = Field(default="", max_length=50000)
    company_name: Optional[str] = Field(None, max_length=255)
    location: Optional[str] = Field(None, max_length=255)
    employment_type: EmploymentType = "full_time"
    status: JobStatus = "draft"
    criteria_weights: Optional[CriteriaWeights] = None


class JobUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=50000)
    company_name: Optional[str] = Field(None, max_length=255)
    location: Optional[str] = Field(None, max_length=255)
    employment_type: Optional[EmploymentType] = None
    status: Optional[JobStatus] = None
    criteria_weights: Optional[CriteriaWeights] = None


class JobOut(BaseModel):
    id: str
    title: str
    description: str
    company_name: Optional[str]
    location: Optional[str]
    employment_type: str
    status: str
    criteria_weights: Optional[dict] = None
    created_by: str
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    applicants_count: int = 0

    model_config = {"from_attributes": True}


class JobListResponse(BaseModel):
    items: list[JobOut]
    total: int


ApplicationStage = Literal["applied", "screening", "interview", "offer", "rejected"]


class RecruiterApplicationOut(BaseModel):
    id: str
    job_id: str
    job_title: str
    candidate_id: str
    candidate_email: str
    candidate_name: str
    stage: str
    created_at: Optional[datetime]
    updated_at: Optional[datetime]


class ApplicationStageUpdate(BaseModel):
    stage: ApplicationStage
