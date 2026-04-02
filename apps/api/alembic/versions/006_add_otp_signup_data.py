"""Add signup_data column to otps table.

Revision ID: 006_add_otp_signup_data
Revises: 005_add_application_cv_match
Create Date: 2026-04-02
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "006_add_otp_signup_data"
down_revision: Union[str, None] = "005_add_application_cv_match"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("otps", sa.Column("signup_data", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("otps", "signup_data")
