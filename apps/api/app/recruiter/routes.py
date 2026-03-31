import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth.dependencies import require_roles
from app.database import get_db
from app.models.job import Job
from app.models.user import User
from app.recruiter.schemas import JobCreate, JobListResponse, JobOut, JobUpdate

router = APIRouter(prefix="/recruiter", tags=["recruiter"])
_recruiter = require_roles("recruiter", "admin")


def _job_query_for_user(db: Session, user: User):
    q = db.query(Job)
    if user.role != "admin":
        q = q.filter(Job.created_by == user.id)
    return q


def _get_job_or_404(db: Session, job_id: str, user: User) -> Job:
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    if user.role != "admin" and job.created_by != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return job


def _job_to_out(job: Job) -> JobOut:
    return JobOut(
        id=job.id,
        title=job.title,
        description=job.description or "",
        company_name=job.company_name,
        location=job.location,
        employment_type=job.employment_type,
        status=job.status,
        created_by=job.created_by,
        created_at=job.created_at,
        updated_at=job.updated_at,
        applicants_count=0,
    )


@router.post("/jobs", response_model=JobOut, status_code=status.HTTP_201_CREATED)
def create_job(
    body: JobCreate,
    db: Session = Depends(get_db),
    user: User = Depends(_recruiter),
):
    row = Job(
        id=str(uuid.uuid4()),
        title=body.title.strip(),
        description=body.description or "",
        company_name=body.company_name.strip() if body.company_name else None,
        location=body.location.strip() if body.location else None,
        employment_type=body.employment_type,
        status=body.status,
        created_by=user.id,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _job_to_out(row)


@router.get("/jobs", response_model=JobListResponse)
def list_jobs(
    status_filter: str = Query("", alias="status", max_length=50),
    search: str = Query("", max_length=200),
    db: Session = Depends(get_db),
    user: User = Depends(_recruiter),
):
    q = _job_query_for_user(db, user)
    if status_filter:
        q = q.filter(Job.status == status_filter.lower())
    if search:
        pattern = f"%{search.lower()}%"
        q = q.filter((Job.title.ilike(pattern)) | (Job.description.ilike(pattern)))
    rows = q.order_by(Job.created_at.desc()).all()
    return JobListResponse(items=[_job_to_out(j) for j in rows], total=len(rows))


@router.get("/jobs/{job_id}", response_model=JobOut)
def get_job(
    job_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(_recruiter),
):
    job = _get_job_or_404(db, job_id, user)
    return _job_to_out(job)


@router.patch("/jobs/{job_id}", response_model=JobOut)
def update_job(
    job_id: str,
    body: JobUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(_recruiter),
):
    job = _get_job_or_404(db, job_id, user)
    data = body.model_dump(exclude_unset=True)
    if "title" in data and data["title"] is not None:
        job.title = data["title"].strip()
    if "description" in data:
        job.description = data["description"] or ""
    if "company_name" in data:
        v = data["company_name"]
        job.company_name = v.strip() if v else None
    if "location" in data:
        v = data["location"]
        job.location = v.strip() if v else None
    if "employment_type" in data and data["employment_type"] is not None:
        job.employment_type = data["employment_type"]
    if "status" in data and data["status"] is not None:
        job.status = data["status"]
    db.commit()
    db.refresh(job)
    return _job_to_out(job)


@router.delete("/jobs/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(
    job_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(_recruiter),
):
    job = _get_job_or_404(db, job_id, user)
    db.delete(job)
    db.commit()
    return None
