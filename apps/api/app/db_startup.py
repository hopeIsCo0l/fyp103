"""Run Alembic migrations (source of truth for PostgreSQL DDL)."""

import logging
import time
from pathlib import Path

from alembic.config import Config
from sqlalchemy import text

from alembic import command
from app.database import engine

logger = logging.getLogger(__name__)


def wait_for_database(max_wait_seconds: float = 90.0, interval: float = 1.0) -> None:
    """Block until PostgreSQL accepts connections (handles Docker restart races)."""
    deadline = time.monotonic() + max_wait_seconds
    last_exc: Exception | None = None
    while time.monotonic() < deadline:
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return
        except Exception as e:
            last_exc = e
            logger.warning("Database not ready yet: %s", e)
            time.sleep(interval)
    raise TimeoutError(
        f"Database not reachable after {max_wait_seconds:.0f}s"
    ) from last_exc


def run_alembic_upgrade() -> None:
    api_root = Path(__file__).resolve().parent.parent
    alembic_ini = api_root / "alembic.ini"
    cfg = Config(str(alembic_ini))
    command.upgrade(cfg, "head")
