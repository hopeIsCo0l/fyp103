"""Shared AI pipeline for EAA Recruit (RAG, hybrid search, scoring, XAI).

Phased implementation: CV–JD TF-IDF similarity, then richer parsing and XAI.
"""

from ai_engine.match import cv_job_similarity, weighted_score_breakdown
from ai_engine.cv_job_model import (
    JobRecord,
    LabeledPairRecord,
    TrainedModelBundle,
    load_bundle,
    rank_jobs_for_cv,
    save_bundle,
    score_pair,
    train_bundle,
)

__version__ = "0.2.0"

__all__ = [
    "__version__",
    "cv_job_similarity",
    "weighted_score_breakdown",
    "LabeledPairRecord",
    "JobRecord",
    "TrainedModelBundle",
    "train_bundle",
    "save_bundle",
    "load_bundle",
    "score_pair",
    "rank_jobs_for_cv",
]
