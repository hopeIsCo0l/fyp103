"""Add CV text and TF-IDF similarity on job_applications.

Revision ID: 005_add_application_cv_match
Revises: 004_add_job_criteria_weights
Create Date: 2026-03-31
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "005_add_application_cv_match"
down_revision: Union[str, None] = "004_add_job_criteria_weights"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("job_applications", sa.Column("cv_text", sa.Text(), nullable=True))
    op.add_column(
        "job_applications",
        sa.Column("cv_similarity_score", sa.Float(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("job_applications", "cv_similarity_score")
    op.drop_column("job_applications", "cv_text")
