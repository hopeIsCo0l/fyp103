"""Shared AI pipeline for EAA Recruit (RAG, hybrid search, scoring, XAI).

Phased implementation: CVParserService, ScoringEngine, and XAI flows will live here
as the API imports this package. Keep side-effect-free imports for FastAPI startup.
"""

__version__ = "0.1.0"

__all__ = ["__version__"]
