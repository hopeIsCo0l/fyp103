#!/usr/bin/env bash
set -e
cd /app

# Optional: run Alembic when tables already exist (safe to skip on failure)
if [ "${RUN_ALEMBIC:-0}" = "1" ]; then
  echo "[entrypoint] Running alembic upgrade head..."
  alembic upgrade head || echo "[entrypoint] alembic skipped or failed (create_all may still apply)"
fi

# Seed first super-admin when enabled (idempotent)
if [ "${SEED_ADMIN_ON_START:-0}" = "1" ]; then
  echo "[entrypoint] Seeding admin user if missing..."
  python seed_admin.py || echo "[entrypoint] seed_admin exited with error"
fi

exec "$@"
