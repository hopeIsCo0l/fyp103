"""Add is_super_admin to users (super admin vs delegated admin).

Revision ID: 007_add_user_is_super_admin
Revises: 006_add_otp_signup_data
Create Date: 2026-04-02
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "007_add_user_is_super_admin"
down_revision: Union[str, None] = "006_add_otp_signup_data"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "is_super_admin",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )


def downgrade() -> None:
    op.drop_column("users", "is_super_admin")
