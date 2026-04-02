import uuid

from ai_engine.match import weighted_score_breakdown
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth.dependencies import require_roles
from app.database import get_db
from app.models.job import Job
from app.models.job_application import JobApplication
from app.models.user import User
from app.recruiter.schemas import (
    ApplicationStageUpdate,
    JobCreate,
    JobListResponse,
    JobOut,
    JobUpdate,
    RecruiterApplicationOut,
)

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


def _applicant_counts(db: Session, job_ids: list[str]) -> dict[str, int]:
    if not job_ids:
        return {}
    rows = (
        db.query(JobApplication.job_id, func.count(JobApplication.id))
        .filter(JobApplication.job_id.in_(job_ids))
        .group_by(JobApplication.job_id)
        .all()
    )
    return {str(jid): int(c) for jid, c in rows}


def _job_to_out(job: Job, applicants_count: int = 0) -> JobOut:
    return JobOut(
        id=job.id,
        title=job.title,
        description=job.description or "",
        company_name=job.company_name,
        location=job.location,
        employment_type=job.employment_type,
        status=job.status,
        criteria_weights=job.criteria_weights,
        created_by=job.created_by,
        created_at=job.created_at,
        updated_at=job.updated_at,
        applicants_count=applicants_count,
    )


def _application_scores(cv_similarity_score: float | None, job: Job) -> dict[str, float]:
    return weighted_score_breakdown(
        cv_similarity_score=cv_similarity_score,
        criteria_weights=job.criteria_weights if isinstance(job.criteria_weights, dict) else None,
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
        criteria_weights=body.criteria_weights.model_dump() if body.criteria_weights else None,
        created_by=user.id,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _job_to_out(row, 0)


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
    counts = _applicant_counts(db, [j.id for j in rows])
    return JobListResponse(
        items=[_job_to_out(j, counts.get(j.id, 0)) for j in rows],
        total=len(rows),
    )


@router.get("/jobs/{job_id}", response_model=JobOut)
def get_job(
    job_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(_recruiter),
):
    job = _get_job_or_404(db, job_id, user)
    counts = _applicant_counts(db, [job.id])
    return _job_to_out(job, counts.get(job.id, 0))


@router.get("/applications", response_model=list[RecruiterApplicationOut])
def list_all_applications(
    db: Session = Depends(get_db),
    user: User = Depends(_recruiter),
):
    q = (
        db.query(JobApplication, User, Job)
        .join(Job, Job.id == JobApplication.job_id)
        .join(User, User.id == JobApplication.candidate_id)
    )
    if user.role != "admin":
        q = q.filter(Job.created_by == user.id)
    rows = q.order_by(JobApplication.created_at.desc()).all()
    out: list[RecruiterApplicationOut] = []
    for app_row, cand, job in rows:
        scores = _application_scores(app_row.cv_similarity_score, job)
        out.append(
            RecruiterApplicationOut(
                id=app_row.id,
                job_id=job.id,
                job_title=job.title,
                candidate_id=cand.id,
                candidate_email=cand.email,
                candidate_name=cand.full_name,
                stage=app_row.stage,
                cv_similarity_score=app_row.cv_similarity_score,
                weighted_total_score=scores["weighted_total_score"],
                score_breakdown=scores,
                created_at=app_row.created_at,
                updated_at=app_row.updated_at,
            )
        )
    return out


@router.get("/jobs/{job_id}/applications", response_model=list[RecruiterApplicationOut])
def list_job_applications(
    job_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(_recruiter),
):
    job = _get_job_or_404(db, job_id, user)
    rows = (
        db.query(JobApplication, User)
        .join(User, User.id == JobApplication.candidate_id)
        .filter(JobApplication.job_id == job.id)
        .order_by(JobApplication.created_at.desc())
        .all()
    )
    out: list[RecruiterApplicationOut] = []
    for app_row, cand in rows:
        scores = _application_scores(app_row.cv_similarity_score, job)
        out.append(
            RecruiterApplicationOut(
                id=app_row.id,
                job_id=job.id,
                job_title=job.title,
                candidate_id=cand.id,
                candidate_email=cand.email,
                candidate_name=cand.full_name,
                stage=app_row.stage,
                cv_similarity_score=app_row.cv_similarity_score,
                weighted_total_score=scores["weighted_total_score"],
                score_breakdown=scores,
                created_at=app_row.created_at,
                updated_at=app_row.updated_at,
            )
        )
    return out


@router.patch("/applications/{application_id}", response_model=RecruiterApplicationOut)
def update_application_stage(
    application_id: str,
    body: ApplicationStageUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(_recruiter),
):
    app_row = db.query(JobApplication).filter(JobApplication.id == application_id).first()
    if not app_row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    _get_job_or_404(db, app_row.job_id, user)
    app_row.stage = body.stage
    db.commit()
    db.refresh(app_row)
    cand = db.query(User).filter(User.id == app_row.candidate_id).first()
    job = db.query(Job).filter(Job.id == app_row.job_id).first()
    assert cand is not None and job is not None
    scores = _application_scores(app_row.cv_similarity_score, job)
    return RecruiterApplicationOut(
        id=app_row.id,
        job_id=app_row.job_id,
        job_title=job.title,
        candidate_id=cand.id,
        candidate_email=cand.email,
        candidate_name=cand.full_name,
        stage=app_row.stage,
        cv_similarity_score=app_row.cv_similarity_score,
        weighted_total_score=scores["weighted_total_score"],
        score_breakdown=scores,
        created_at=app_row.created_at,
        updated_at=app_row.updated_at,
    )


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
    if "criteria_weights" in data:
        cw = body.criteria_weights
        job.criteria_weights = cw.model_dump() if cw is not None else None
    db.commit()
    db.refresh(job)
    counts = _applicant_counts(db, [job.id])
    return _job_to_out(job, counts.get(job.id, 0))


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
