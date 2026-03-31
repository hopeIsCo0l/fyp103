from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.jobs.schemas import PublicJobListResponse, PublicJobOut
from app.models.job import Job

router = APIRouter(prefix="/jobs", tags=["jobs"])


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
