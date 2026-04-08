from ai_engine.match import weighted_score_breakdown
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.auth.dependencies import require_roles
from app.candidate.schemas import CandidateApplicationOut, CvExtractOut
from app.cv_extraction import CvExtractionError, extract_text_from_upload
from app.database import get_db
from app.models.job import Job
from app.models.job_application import JobApplication
from app.models.user import User

router = APIRouter(prefix="/candidate", tags=["candidate"])
_candidate = require_roles("candidate", "admin")

_FORMAT_BY_SUFFIX = {".pdf": "pdf", ".docx": "docx", ".txt": "txt"}


@router.post("/cv/extract", response_model=CvExtractOut)
async def extract_cv_from_file(
    file: UploadFile = File(...),
    user: User = Depends(_candidate),
):
    """Extract plain text from an uploaded resume (PDF, DOCX, or TXT) for matching and apply."""
    assert user.id
    filename = file.filename or "resume"
    data = await file.read()
    try:
        text = extract_text_from_upload(filename, data)
    except CvExtractionError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": e.code, "message": str(e)},
        ) from e
    suffix = ""
    if filename and "." in filename:
        suffix = "." + filename.rsplit(".", 1)[-1].lower()
    fmt = _FORMAT_BY_SUFFIX.get(suffix, "txt")
    if len(text) > 50000:
        text = text[:50000]
    return CvExtractOut(cv_text=text, file_format=fmt)


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
        scores = weighted_score_breakdown(
            cv_similarity_score=app_row.cv_similarity_score,
            criteria_weights=job.criteria_weights if isinstance(job.criteria_weights, dict) else None,
        )
        out.append(
            CandidateApplicationOut(
                id=app_row.id,
                job_id=job.id,
                job_title=job.title,
                company_name=job.company_name,
                stage=app_row.stage,
                cv_similarity_score=app_row.cv_similarity_score,
                weighted_total_score=scores["weighted_total_score"],
                score_breakdown=scores,
                created_at=app_row.created_at,
                updated_at=app_row.updated_at,
            )
        )
    return out
