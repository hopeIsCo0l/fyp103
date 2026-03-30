"""Run Alembic migrations (source of truth for PostgreSQL DDL)."""

from pathlib import Path

from alembic import command
from alembic.config import Config


def run_alembic_upgrade() -> None:
    api_root = Path(__file__).resolve().parent.parent
    alembic_ini = api_root / "alembic.ini"
    cfg = Config(str(alembic_ini))
    command.upgrade(cfg, "head")
