"""Shared AI pipeline for EAA Recruit (RAG, hybrid search, scoring, XAI).

Phased implementation: CV–JD TF-IDF similarity, then richer parsing and XAI.
"""

from ai_engine.match import cv_job_similarity

__version__ = "0.2.0"

__all__ = ["__version__", "cv_job_similarity"]
