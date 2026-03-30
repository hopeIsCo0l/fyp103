"""Alembic downgrade/upgrade round-trip (PostgreSQL)."""

from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import text

from app.database import engine


@pytest.mark.skipif(
    engine.url.get_backend_name() != "postgresql",
    reason="Alembic round-trip requires PostgreSQL",
)
def test_alembic_downgrade_base_then_upgrade_head():
    api_root = Path(__file__).resolve().parent.parent
    cfg = Config(str(api_root / "alembic.ini"))

    command.downgrade(cfg, "base")
    with engine.connect() as conn:
        r = conn.execute(
            text(
                "SELECT 1 FROM information_schema.tables "
                "WHERE table_schema = 'public' AND table_name = 'users'"
            )
        ).first()
    assert r is None

    command.upgrade(cfg, "head")
    with engine.connect() as conn:
        r = conn.execute(
            text(
                "SELECT 1 FROM information_schema.tables "
                "WHERE table_schema = 'public' AND table_name = 'users'"
            )
        ).first()
    assert r is not None
