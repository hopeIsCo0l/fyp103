import uuid

from ai_engine.match import cv_job_similarity
from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth.dependencies import require_roles
from app.candidate.schemas import CandidateApplicationOut
from app.database import get_db
from app.jobs.schemas import ApplyBody, PublicJobListResponse, PublicJobOut
from app.models.job import Job
from app.models.job_application import JobApplication
from app.models.user import User

router = APIRouter(prefix="/jobs", tags=["jobs"])
_candidate = require_roles("candidate", "admin")


def _job_text_for_match(job: Job) -> str:
    parts = [job.title or "", (job.description or "").strip()]
    return "\n".join(p for p in parts if p)


@router.post("/{job_id}/apply", response_model=CandidateApplicationOut, status_code=status.HTTP_201_CREATED)
def apply_to_open_job(
    job_id: str,
    body: ApplyBody = Body(default_factory=ApplyBody),
    db: Session = Depends(get_db),
    user: User = Depends(_candidate),
):
    job = db.query(Job).filter(Job.id == job_id, Job.status == "open").first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    if job.created_by == user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot apply to your own job posting",
        )
    existing = (
        db.query(JobApplication)
        .filter(JobApplication.job_id == job_id, JobApplication.candidate_id == user.id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already applied to this job")
    cv_raw = (body.cv_text or "").strip()
    cv_text = cv_raw if cv_raw else None
    score = None
    if cv_text:
        score = cv_job_similarity(cv_text, _job_text_for_match(job))
    row = JobApplication(
        id=str(uuid.uuid4()),
        job_id=job.id,
        candidate_id=user.id,
        stage="applied",
        cv_text=cv_text,
        cv_similarity_score=score,
    )
    db.add(row)
    try:
        db.commit()
        db.refresh(row)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already applied to this job") from None
    return CandidateApplicationOut(
        id=row.id,
        job_id=job.id,
        job_title=job.title,
        company_name=job.company_name,
        stage=row.stage,
        cv_similarity_score=row.cv_similarity_score,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


def _to_public(job: Job) -> PublicJobOut:
    return PublicJobOut(
        id=job.id,
        title=job.title,
        description=job.description or "",
        company_name=job.company_name,
        location=job.location,
        employment_type=job.employment_type,
        created_at=job.created_at,
    )


@router.get("", response_model=PublicJobListResponse)
def list_open_jobs(
    search: str = Query("", max_length=200),
    employment_type: str = Query("", max_length=50),
    location: str = Query("", max_length=200),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    q = db.query(Job).filter(Job.status == "open")
    if search:
        pattern = f"%{search.lower()}%"
        q = q.filter(
            (Job.title.ilike(pattern))
            | (Job.description.ilike(pattern))
            | (Job.company_name.ilike(pattern))
        )
    if employment_type:
        q = q.filter(Job.employment_type == employment_type.lower())
    if location:
        q = q.filter(Job.location.ilike(f"%{location}%"))
    total = q.count()
    rows = (
        q.order_by(Job.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )
    return PublicJobListResponse(
        items=[_to_public(j) for j in rows],
        total=total,
        page=page,
        size=size,
    )


@router.get("/{job_id}", response_model=PublicJobOut)
def get_open_job(job_id: str, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id, Job.status == "open").first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return _to_public(job)
