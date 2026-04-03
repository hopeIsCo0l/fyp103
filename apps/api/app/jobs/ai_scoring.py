from __future__ import annotations

import os
from pathlib import Path

from ai_engine.cv_job_model import load_bundle, score_pair
from ai_engine.match import cv_job_similarity

_bundle_cache = None
_cache_path = None


def _default_model_path() -> Path:
    env_path = os.getenv("AI_MODEL_PATH")
    if env_path:
        return Path(env_path)
    repo_root_guess = Path(__file__).resolve().parents[4]
    candidate = repo_root_guess / "sample_data" / "models" / "cv_job_model.pkl"
    if candidate.exists():
        return candidate
    return Path("sample_data/models/cv_job_model.pkl")


def _get_bundle():
    global _bundle_cache
    global _cache_path

    model_path = _default_model_path()
    if not model_path.exists():
        return None
    if _bundle_cache is not None and _cache_path == model_path:
        return _bundle_cache

    _bundle_cache = load_bundle(model_path)
    _cache_path = model_path
    return _bundle_cache


def score_cv_for_job(cv_text: str, job_title: str, job_description: str) -> dict[str, float | str]:
    """Score CV against one job; use persisted model when available."""
    bundle = _get_bundle()
    if bundle is None:
        similarity = cv_job_similarity(cv_text, f"{job_title}\n{job_description}")
        if similarity >= 0.40:
            label = "good"
        elif similarity >= 0.20:
            label = "medium"
        else:
            label = "bad"
        return {
            "predicted_fit": label,
            "ranking_score": similarity,
            "prob_good": similarity if label == "good" else 0.0,
            "prob_medium": similarity if label == "medium" else 0.0,
            "prob_bad": 1.0 - similarity if label == "bad" else 0.0,
            "lexical_similarity": similarity,
            "scorer_source": "fallback_tfidf_cosine",
        }

    score = score_pair(
        bundle,
        cv_text=cv_text,
        job_title=job_title,
        job_description=job_description,
    )
    score["scorer_source"] = str(_default_model_path())
    return score
