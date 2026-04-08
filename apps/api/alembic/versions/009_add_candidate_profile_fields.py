"""Add candidate profile completion fields.

Revision ID: 009_add_candidate_profile_fields
Revises: 008_add_must_change_password
Create Date: 2026-04-08
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "009_add_candidate_profile_fields"
down_revision: Union[str, None] = "008_add_must_change_password"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "profile_completion_skipped",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )
    op.add_column("users", sa.Column("birth_date", sa.Date(), nullable=True))
    op.add_column("users", sa.Column("country", sa.String(length=100), nullable=True))
    op.add_column("users", sa.Column("city", sa.String(length=100), nullable=True))
    op.add_column("users", sa.Column("subcity", sa.String(length=100), nullable=True))
    op.add_column("users", sa.Column("address_line", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("education_level", sa.String(length=100), nullable=True))
    op.add_column("users", sa.Column("high_school_name", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("high_school_completion_year", sa.Integer(), nullable=True))
    op.add_column(
        "users",
        sa.Column("higher_education_institution", sa.String(length=255), nullable=True),
    )
    op.add_column("users", sa.Column("higher_education_level", sa.String(length=100), nullable=True))
    op.add_column("users", sa.Column("field_of_study", sa.String(length=150), nullable=True))
    op.add_column("users", sa.Column("graduation_year", sa.Integer(), nullable=True))
    op.add_column("users", sa.Column("height_cm", sa.Float(), nullable=True))
    op.add_column("users", sa.Column("weight_kg", sa.Float(), nullable=True))
    op.add_column("users", sa.Column("skills_summary", sa.Text(), nullable=True))
    op.add_column("users", sa.Column("experience_summary", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "experience_summary")
    op.drop_column("users", "skills_summary")
    op.drop_column("users", "weight_kg")
    op.drop_column("users", "height_cm")
    op.drop_column("users", "graduation_year")
    op.drop_column("users", "field_of_study")
    op.drop_column("users", "higher_education_level")
    op.drop_column("users", "higher_education_institution")
    op.drop_column("users", "high_school_completion_year")
    op.drop_column("users", "high_school_name")
    op.drop_column("users", "education_level")
    op.drop_column("users", "address_line")
    op.drop_column("users", "subcity")
    op.drop_column("users", "city")
    op.drop_column("users", "country")
    op.drop_column("users", "birth_date")
    op.drop_column("users", "profile_completion_skipped")
