"""Shared recruitment data shapes (criteria weights, parsed CV payloads, etc.).

Database migrations remain in ``apps/api/alembic``; this package holds portable types.
"""

from recruit_database.criteria_weights import CriteriaWeights

__all__ = ["CriteriaWeights", "__version__"]

__version__ = "0.1.0"
