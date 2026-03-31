# Architecture

## Apps

### `apps/api`
- FastAPI application
- SQLAlchemy models (`User`, `Job`, sessions, OTP, audit, password reset)
- JWT auth + OTP verification/login; recruiter job CRUD under `/api/recruiter/jobs`; public open-job browse under `/api/jobs`
- SMTP email delivery (dev fallback to console logging)

### `apps/web`
- React + TypeScript + MUI
- Auth UI: signup, signin, OTP verify
- Axios API client with bearer token interceptor

## Packages (shared Python)

Install from repo root for local dev (Docker API image still uses `apps/api` only until compose copies `packages/`):

```powershell
pip install -e ./packages/ai-engine
pip install -e ./packages/database
pip install -e ./packages/utils
```

| Package | Role |
|--------|------|
| `packages/ai-engine` (`recruit-ai-engine`) | CV parsing, TF‑IDF / embedding scoring, exams, XAI — **imported by `apps/api`** as logic is implemented. |
| `packages/database` (`recruit-database`) | Portable types (e.g. `CriteriaWeights`), JSON shapes; **PostgreSQL + pgvector** DDL remains under **Alembic in `apps/api`**. |
| `packages/utils` (`recruit-utils`) | Shared text utilities; Amharic/Unicode normalization as needed. |

**North star:** phased AI delivery; hybrid lexical + LLM; no replacement of Alembic.

## Docker

- `docker/api.Dockerfile`: backend image
- `docker/web.Dockerfile`: frontend image
- `docker/docker-compose.yml`: postgres + api + web

## Runtime

- API database: PostgreSQL (see `docker/docker-compose.yml`; host port `5433` → container `5432`)
- Frontend talks to API via Vite proxy (`/api`) in dev
- **Schema:** Alembic (`apps/api/alembic/`) applies versioned DDL on API startup (`run_alembic_upgrade` in `app/main.py`). Additional idempotent patches for legacy DBs live in `app/db_migrate.py` (e.g. `users` column drift, `audit_logs` composite index).
- Week 1 auth: password sign-in audits `auth.login_success` / `auth.login_failed` / `auth.locked`; optional unique `users.phone`; composite index on `audit_logs(created_at, actor_id, action)` (see `init_db.py` for idempotent PG DDL)

## CI/CD

- CI runs lint/build for api/web on push + PR
- CD builds and pushes both images to GHCR on main

## Scripts

- `scripts/run-backend.ps1`
- `scripts/run-frontend.ps1`
- `scripts/run-all.ps1`
- `scripts/free-ports.ps1`
- `scripts/free-ports.sh`
