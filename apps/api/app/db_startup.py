"""Run Alembic migrations (source of truth for PostgreSQL DDL)."""

from pathlib import Path

from alembic.config import Config

from alembic import command


def run_alembic_upgrade() -> None:
    api_root = Path(__file__).resolve().parent.parent
    alembic_ini = api_root / "alembic.ini"
    cfg = Config(str(alembic_ini))
    command.upgrade(cfg, "head")
