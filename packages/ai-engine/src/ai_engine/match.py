"""TF-IDF + cosine similarity between CV text and job description (SRS FR-03 baseline)."""

from __future__ import annotations

import re

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

_MAX_FEATURES = 5000


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
