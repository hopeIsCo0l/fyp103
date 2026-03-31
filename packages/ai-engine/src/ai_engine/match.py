"""TF-IDF + cosine similarity between CV text and job description (SRS FR-03 baseline)."""

from __future__ import annotations

import re
from collections.abc import Mapping

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

_MAX_FEATURES = 5000
_DEFAULT_WEIGHTS = {"cv": 0.40, "exam": 0.35, "interview": 0.25}


def _normalize(text: str) -> str:
    t = text.strip().lower()
    t = re.sub(r"\s+", " ", t)
    return t


def cv_job_similarity(cv_text: str, job_text: str) -> float:
    """Return cosine similarity in [0.0, 1.0] between CV and job (title + description).

    Empty or whitespace-only inputs yield 0.0.
    """
    cv = _normalize(cv_text or "")
    jd = _normalize(job_text or "")
    if not cv or not jd:
        return 0.0
    vec = TfidfVectorizer(min_df=1, max_features=_MAX_FEATURES, stop_words="english")
    try:
        tf = vec.fit_transform([cv, jd])
    except ValueError:
        return 0.0
    sim = cosine_similarity(tf[0:1], tf[1:2])[0, 0]
    return float(max(0.0, min(1.0, sim)))


def weighted_score_breakdown(
    cv_similarity_score: float | None,
    criteria_weights: Mapping[str, float] | None,
) -> dict[str, float]:
    """Return transparent weighted scoring breakdown.

    Exam and interview scores are placeholders (0.0) until those modules ship.
    """
    weights = dict(_DEFAULT_WEIGHTS)
    if criteria_weights:
        for key in ("cv", "exam", "interview"):
            if key in criteria_weights:
                weights[key] = float(criteria_weights[key])

    cv_score = float(cv_similarity_score or 0.0)
    exam_score = 0.0
    interview_score = 0.0
    weighted_total = (
        (weights["cv"] * cv_score)
        + (weights["exam"] * exam_score)
        + (weights["interview"] * interview_score)
    )
    return {
        "cv_weight": weights["cv"],
        "exam_weight": weights["exam"],
        "interview_weight": weights["interview"],
        "cv_score": cv_score,
        "exam_score": exam_score,
        "interview_score": interview_score,
        "weighted_total_score": float(max(0.0, min(1.0, weighted_total))),
    }
