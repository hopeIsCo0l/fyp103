# Weighted Transparent Scoring (Current Phase)

## Purpose

Expose a deterministic, auditable score breakdown per application while exam/interview modules are still pending.

## Formula

Given recruiter criteria weights:
- `cv_weight`
- `exam_weight`
- `interview_weight`

And component scores:
- `cv_score`: TF-IDF/cosine similarity in `[0, 1]`
- `exam_score`: placeholder `0.0` (until exam feature ships)
- `interview_score`: placeholder `0.0` (until interview scoring ships)

Weighted total:

`weighted_total_score = cv_weight * cv_score + exam_weight * exam_score + interview_weight * interview_score`

## API Exposure

Application responses now include:
- `cv_similarity_score`
- `weighted_total_score`
- `score_breakdown` (weights, component scores, and weighted total)

## Code References

- `packages/ai-engine/src/ai_engine/match.py` (`weighted_score_breakdown`)
- `apps/api/app/jobs/routes.py`
- `apps/api/app/candidate/routes.py`
- `apps/api/app/recruiter/routes.py`
- `apps/api/tests/test_applications.py`
