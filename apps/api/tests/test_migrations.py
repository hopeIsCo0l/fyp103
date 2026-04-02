"""Alembic downgrade/upgrade round-trip (PostgreSQL)."""

from pathlib import Path

import pytest
from alembic.config import Config
from sqlalchemy import text

from alembic import command
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


@pytest.mark.skipif(
    engine.url.get_backend_name() != "postgresql",
    reason="Alembic transition verification requires PostgreSQL",
)
def test_alembic_upgrade_from_003_to_head_adds_scoring_columns():
    api_root = Path(__file__).resolve().parent.parent
    cfg = Config(str(api_root / "alembic.ini"))

    command.downgrade(cfg, "base")
    command.upgrade(cfg, "003_add_job_applications")

    with engine.connect() as conn:
        mid_rev = conn.execute(text("SELECT version_num FROM alembic_version")).scalar_one()
        assert mid_rev == "003_add_job_applications"
        app_cols = conn.execute(
            text(
                """
                SELECT column_name
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'job_applications'
                  AND column_name IN ('cv_text', 'cv_similarity_score')
                """
            )
        ).fetchall()
        jobs_cols = conn.execute(
            text(
                """
                SELECT column_name
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'jobs'
                  AND column_name = 'criteria_weights'
                """
            )
        ).fetchall()
        assert app_cols == []
        assert jobs_cols == []

    command.upgrade(cfg, "head")

    with engine.connect() as conn:
        head_rev = conn.execute(text("SELECT version_num FROM alembic_version")).scalar_one()
        assert head_rev == "008_add_must_change_password"
        app_cols = {
            row[0]
            for row in conn.execute(
                text(
                    """
                    SELECT column_name
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = 'job_applications'
                      AND column_name IN ('cv_text', 'cv_similarity_score')
                    """
                )
            ).fetchall()
        }
        jobs_cols = {
            row[0]
            for row in conn.execute(
                text(
                    """
                    SELECT column_name
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = 'jobs'
                      AND column_name = 'criteria_weights'
                    """
                )
            ).fetchall()
        }
        assert app_cols == {"cv_text", "cv_similarity_score"}
        assert jobs_cols == {"criteria_weights"}
