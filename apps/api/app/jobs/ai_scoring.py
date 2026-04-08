from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import httpx
from ai_engine.cv_job_model import load_bundle, score_pair
from ai_engine.match import cv_job_similarity

from app.config import settings

_bundle_cache = None
_cache_path = None
_REMOTE_JOB_ID = "primary-job"


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


def _label_from_similarity(similarity: float) -> str:
    if similarity >= 0.40:
        return "good"
    if similarity >= 0.20:
        return "medium"
    return "bad"


def _score_dict(similarity: float, scorer_source: str, *, predicted_fit: str | None = None) -> dict[str, float | str]:
    label = predicted_fit or _label_from_similarity(similarity)
    return {
        "predicted_fit": label,
        "ranking_score": similarity,
        "prob_good": similarity if label == "good" else 0.0,
        "prob_medium": similarity if label == "medium" else 0.0,
        "prob_bad": 1.0 - similarity if label == "bad" else 0.0,
        "lexical_similarity": similarity,
        "scorer_source": scorer_source,
    }


def _local_score(cv_text: str, job_title: str, job_description: str) -> dict[str, float | str]:
    similarity_text = f"{job_title}\n{job_description}"
    bundle = _get_bundle()
    if bundle is None:
        similarity = cv_job_similarity(cv_text, similarity_text)
        return _score_dict(similarity, "fallback_tfidf_cosine")

    try:
        score = score_pair(
            bundle,
            cv_text=cv_text,
            job_title=job_title,
            job_description=job_description,
        )
    except Exception:
        similarity = cv_job_similarity(cv_text, similarity_text)
        return _score_dict(similarity, "fallback_tfidf_cosine")
    score["scorer_source"] = str(_default_model_path())
    return score


def _remote_score(
    cv_text: str,
    job_title: str,
    job_description: str,
    company_name: str | None,
) -> dict[str, float | str] | None:
    base_url = settings.EA_CV_SCORER_URL.strip().rstrip("/")
    if not base_url:
        return None

    payload = {
        "cv_text": cv_text,
        "jobs": [
            {
                "job_id": _REMOTE_JOB_ID,
                "title": job_title,
                "description": job_description,
                "company_name": company_name or "",
            }
        ],
        "top_k": 1,
    }
    try:
        response = httpx.post(
            f"{base_url}/v1/score",
            json=payload,
            timeout=settings.EA_CV_SCORER_TIMEOUT_SEC,
        )
        response.raise_for_status()
        data = response.json()
    except (httpx.HTTPError, ValueError):
        return None

    ranked = data.get("ranked_results")
    if not isinstance(ranked, list):
        return None

    for item in ranked:
        if not isinstance(item, dict) or item.get("job_id") != _REMOTE_JOB_ID:
            continue
        score = _safe_float(item.get("score"))
        if score is None:
            return None
        label = item.get("label")
        scorer_source = str(data.get("scorer_source") or "remote_scorer")
        return _score_dict(
            score,
            scorer_source,
            predicted_fit=label if label in {"bad", "medium", "good"} else None,
        )
    return None


def _safe_float(value: Any) -> float | None:
    try:
        result = float(value)
    except (TypeError, ValueError):
        return None
    return max(0.0, min(1.0, result))


def score_cv_for_job(
    cv_text: str,
    job_title: str,
    job_description: str,
    company_name: str | None = None,
) -> dict[str, float | str]:
    """Score CV against one job using remote scorer when configured, else local fallback."""
    remote = _remote_score(cv_text, job_title, job_description, company_name)
    if remote is not None:
        return remote
    return _local_score(cv_text, job_title, job_description)
