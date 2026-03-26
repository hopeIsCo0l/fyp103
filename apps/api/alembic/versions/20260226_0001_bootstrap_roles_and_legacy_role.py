"""Bootstrap roles table and migrate legacy users.role string to role_id.

Revision ID: 0001_bootstrap
Revises:
Create Date: 2026-02-26

"""

from typing import Sequence, Union

from sqlalchemy.orm import sessionmaker

from alembic import op
from app.legacy_migrate import migrate_legacy_role_column
from app.role_utils import ensure_roles

revision: str = "0001_bootstrap"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    migrate_legacy_role_column(bind.engine)
    Session = sessionmaker(bind=bind.engine)
    db = Session()
    try:
        ensure_roles(db)
    finally:
        db.close()


def downgrade() -> None:
    pass
