"""Add job_applications table.

Revision ID: 003_add_job_applications
Revises: 002_add_jobs
Create Date: 2026-03-28
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "003_add_job_applications"
down_revision: Union[str, None] = "002_add_jobs"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "job_applications",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("job_id", sa.String(length=36), nullable=False),
        sa.Column("candidate_id", sa.String(length=36), nullable=False),
        sa.Column("stage", sa.String(length=50), nullable=False, server_default=sa.text("'applied'")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["candidate_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["job_id"], ["jobs.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("job_id", "candidate_id", name="uq_job_applications_job_candidate"),
    )
    op.create_index(op.f("ix_job_applications_candidate_id"), "job_applications", ["candidate_id"], unique=False)
    op.create_index(op.f("ix_job_applications_id"), "job_applications", ["id"], unique=False)
    op.create_index(op.f("ix_job_applications_job_id"), "job_applications", ["job_id"], unique=False)


def downgrade() -> None:
    op.drop_table("job_applications")
