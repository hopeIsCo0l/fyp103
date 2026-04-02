"""Add must_change_password for admin-issued temporary passwords.

Revision ID: 008_add_must_change_password
Revises: 007_add_user_is_super_admin
Create Date: 2026-04-02
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "008_add_must_change_password"
down_revision: Union[str, None] = "007_add_user_is_super_admin"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "must_change_password",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )


def downgrade() -> None:
    op.drop_column("users", "must_change_password")
