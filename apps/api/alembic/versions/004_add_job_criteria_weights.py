"""Add criteria_weights JSONB on jobs (SRS FR-01).

Revision ID: 004_add_job_criteria_weights
Revises: 003_add_job_applications
Create Date: 2026-03-31
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "004_add_job_criteria_weights"
down_revision: Union[str, None] = "003_add_job_applications"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "jobs",
        sa.Column("criteria_weights", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("jobs", "criteria_weights")
