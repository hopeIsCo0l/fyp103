"""Remote scorer integration behavior for app.jobs.ai_scoring."""

from unittest.mock import patch

from app.config import settings
from app.jobs.ai_scoring import score_cv_for_job


class _FakeResponse:
    def __init__(self, payload: dict):
        self._payload = payload

    def raise_for_status(self) -> None:
        return None

    def json(self) -> dict:
        return self._payload


def test_score_cv_for_job_uses_remote_scorer_when_configured(monkeypatch):
    monkeypatch.setattr(settings, "EA_CV_SCORER_URL", "http://cv-similarity-api:8000")
    monkeypatch.setattr(settings, "EA_CV_SCORER_TIMEOUT_SEC", 1.5)

    response = _FakeResponse(
        {
            "scorer_source": "baseline_tfidf_cosine_v1",
            "ranked_results": [
                {
                    "rank": 1,
                    "job_id": "primary-job",
                    "score": 0.88,
                    "label": "good",
                }
            ],
        }
    )
    with (
        patch("app.jobs.ai_scoring.httpx.post", return_value=response) as remote_post,
        patch("app.jobs.ai_scoring._local_score") as local_score,
    ):
        out = score_cv_for_job(
            cv_text="Ground operations trainee with ramp handling experience.",
            job_title="Trainee Ground Operations Officer",
            job_description="Coordinate ramp operations and baggage handling.",
            company_name="Ethiopian Airlines",
        )

    assert out["ranking_score"] == 0.88
    assert out["predicted_fit"] == "good"
    assert out["scorer_source"] == "baseline_tfidf_cosine_v1"
    local_score.assert_not_called()
    remote_post.assert_called_once_with(
        "http://cv-similarity-api:8000/v1/score",
        json={
            "cv_text": "Ground operations trainee with ramp handling experience.",
            "jobs": [
                {
                    "job_id": "primary-job",
                    "title": "Trainee Ground Operations Officer",
                    "description": "Coordinate ramp operations and baggage handling.",
                    "company_name": "Ethiopian Airlines",
                }
            ],
            "top_k": 1,
        },
        timeout=1.5,
    )


def test_score_cv_for_job_falls_back_locally_when_remote_returns_no_match(monkeypatch):
    monkeypatch.setattr(settings, "EA_CV_SCORER_URL", "http://cv-similarity-api:8000")

    response = _FakeResponse(
        {
            "scorer_source": "baseline_tfidf_cosine_v1",
            "ranked_results": [],
            "excluded_jobs": [{"job_id": "primary-job", "reason": "non-ethiopian"}],
        }
    )
    fallback = {
        "predicted_fit": "medium",
        "ranking_score": 0.33,
        "prob_good": 0.0,
        "prob_medium": 0.33,
        "prob_bad": 0.0,
        "lexical_similarity": 0.33,
        "scorer_source": "fallback_tfidf_cosine",
    }
    with (
        patch("app.jobs.ai_scoring.httpx.post", return_value=response),
        patch("app.jobs.ai_scoring._local_score", return_value=fallback) as local_score,
    ):
        out = score_cv_for_job(
            cv_text="Python FastAPI engineer with API testing experience.",
            job_title="Backend Developer",
            job_description="Build APIs for internal tools.",
            company_name="Acme Recruit",
        )

    assert out == fallback
    local_score.assert_called_once_with(
        "Python FastAPI engineer with API testing experience.",
        "Backend Developer",
        "Build APIs for internal tools.",
    )
