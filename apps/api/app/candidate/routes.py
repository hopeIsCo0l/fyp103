from sqlalchemy.orm import Session

from fastapi import APIRouter, Depends

from app.auth.dependencies import require_roles
from app.candidate.schemas import CandidateApplicationOut
from app.database import get_db
from app.models.job import Job
from app.models.job_application import JobApplication
from app.models.user import User

router = APIRouter(prefix="/candidate", tags=["candidate"])
_candidate = require_roles("candidate", "admin")


@router.get("/applications", response_model=list[CandidateApplicationOut])
def list_my_applications(
    db: Session = Depends(get_db),
    user: User = Depends(_candidate),
):
    rows = (
        db.query(JobApplication, Job)
        .join(Job, Job.id == JobApplication.job_id)
        .filter(JobApplication.candidate_id == user.id)
        .order_by(JobApplication.created_at.desc())
        .all()
    )
    out: list[CandidateApplicationOut] = []
    for app_row, job in rows:
        out.append(
            CandidateApplicationOut(
                id=app_row.id,
                job_id=job.id,
                job_title=job.title,
                company_name=job.company_name,
                stage=app_row.stage,
                created_at=app_row.created_at,
                updated_at=app_row.updated_at,
            )
        )
    return out
