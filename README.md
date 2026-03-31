# FYP103 - AI Recruitment Platform

A clean monorepo-style structure for an AI-powered recruitment system.

## Repository Structure

```text
fypimp103/
├─ apps/
│  ├─ api/                    # FastAPI backend (auth, OTP, JWT, DB)
│  └─ web/                    # React + TypeScript frontend
├─ docker/
│  ├─ api.Dockerfile
│  ├─ web.Dockerfile
│  └─ docker-compose.yml
├─ packages/                  # Shared Python libs (install with pip -e; see ARCHITECTURE.md)
│  ├─ ai-engine/              # CV parsing, scoring, XAI (scaffold)
│  ├─ database/               # Shared Pydantic types / JSON shapes (Alembic stays in apps/api)
│  └─ utils/                  # Text helpers, future Amharic normalization
├─ scripts/
├─ .github/workflows/
├─ ARCHITECTURE.md
└─ README.md
```

## Run the stack (Docker Compose — production-like)

The intended way to run the full system matches deployment: **PostgreSQL**, API, and web in Docker with env-driven configuration (`docker/.env`). Use this for development, demos, and anything that should behave like a real environment—not a stripped-down “local only” shortcut.

From the repo root:

```powershell
.\scripts\free-ports.ps1
.\scripts\docker-up.ps1
```

Or manually:

```powershell
cd docker
copy .env.example .env
docker compose up --build
```

The first run creates `docker/.env` from `docker/.env.example` if missing. Copy and adjust secrets, database credentials, and admin seed values for any shared or production-like deployment.

**Services**

| Service    | URL / host |
|-----------|------------|
| Web (Vite) | http://localhost:5173 |
| API (Swagger) | http://localhost:8000/docs |
| PostgreSQL | `localhost:5433` (user/password/db from `docker/.env`) |

**Inside Docker:** the Vite dev server proxies `/api` to `http://backend:8000` (see `BACKEND_PROXY_TARGET` in `docker-compose.yml`). The browser still uses `http://localhost:5173`, so no manual API URL change is needed.

**Super admin** (when `SEED_ADMIN_ON_START=1`, default): email `admin@recruit-system.com`, password `Admin123!` — override with `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `docker/.env`.

**Optional:** set `RUN_ALEMBIC=1` in `docker/.env` to run `alembic upgrade head` before the API starts.

**Inspect Postgres from the host**

```powershell
docker compose -f docker/docker-compose.yml exec postgres psql -U postgres -d recruit_db -c "\dt"
```

(Run from `docker/` or pass `-f` from repo root.)

### Optional: processes on the host (limited parity)

Running the API and web **directly on the host** (e.g. `.\scripts\run-backend.ps1` / `.\scripts\run-frontend.ps1`) is only for **narrow automation, debugging, or CI-style checks**. It does not replace Docker + PostgreSQL for realistic behavior. The API defaults in `apps/api/.env.example` may use SQLite for tests only; for database parity without full compose, point `DATABASE_URL` at PostgreSQL yourself.

## OTP Email Setup

Set SMTP values in `apps/api/.env` (or copy from `apps/api/.env.example`).

Example for Mailtrap:

```env
SMTP_HOST=live.smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=api
SMTP_PASSWORD=YOUR_API_TOKEN
EMAIL_FROM=hello@yourdomain.com
```

## CI/CD

- CI: `.github/workflows/ci.yml` — backend: `ruff`, import check, `pytest` (PostgreSQL service); frontend: `npm run lint`, `npm run build`
- CD: `.github/workflows/cd.yml` (build/push Docker images to GHCR)

## API contract (OpenAPI)

- Interactive docs: `GET /docs` (Swagger UI)
- Machine-readable schema: `GET /openapi.json` (use for codegen or review)

## Database migrations

- **Runtime:** On API startup (unless `SKIP_STARTUP_DB` is set), `app/main.py` runs **`alembic upgrade head`** via `run_alembic_upgrade()`, then **`run_postgresql_migrations(engine)`** for legacy PostgreSQL patches (`app/db_migrate.py`), then **`ensure_super_admin()`**. Same sequence applies when you run `python init_db.py` from `apps/api`.
- **Alembic:** Versioned DDL lives under `apps/api/alembic/` (e.g. initial revision `001_initial_schema`). Rollback (dev only): `cd apps/api && alembic downgrade -1` (or `downgrade base` to drop migrated state—use with care).
- **Integration test:** `tests/test_migrations.py` runs Alembic downgrade to base then upgrade to head on PostgreSQL (skipped on non-Postgres engines).

**Manual upgrade (local)**

From `apps/api` with `DATABASE_URL` set (e.g. Docker Postgres on port 5433):

```powershell
cd apps/api
python -m alembic upgrade head
```

Or: `python init_db.py` (Alembic upgrade + legacy patches).

## Auth Endpoints

- `POST /api/auth/signup`
- `POST /api/auth/verify-email`
- `POST /api/auth/resend-otp`
- `POST /api/auth/signin`
- `POST /api/auth/request-login-otp`
- `POST /api/auth/verify-login-otp`
- `POST /api/auth/refresh`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/auth/recruiter-only`
- `GET /api/auth/admin-only`

## Recruiter job postings (Week 2)

Requires **`recruiter`** or **`admin`** role. Recruiters see only jobs they created; admins see all.

- `POST /api/recruiter/jobs` — create posting (`title`, `description`, optional `company_name`, `location`, `employment_type`, `status`, optional `criteria_weights` — SRS FR-01: `{cv, exam, interview}` summing to 1.0)
- `GET /api/recruiter/jobs` — list (query: `status`, `search`)
- `GET /api/recruiter/jobs/{job_id}` — detail (404 if not owned / not admin)
- `PATCH /api/recruiter/jobs/{job_id}` — update fields (including optional `criteria_weights`)
- `DELETE /api/recruiter/jobs/{job_id}` — delete posting

Recruiter UI: create and **edit** postings from the Jobs page; dashboard stats and “Your postings” use the **live** job list from `GET /api/recruiter/jobs`.

## Public job discovery (Week 2)

**No authentication.** Only listings with **`status=open`** are returned (draft/paused/closed are hidden).

- `GET /api/jobs` — list open jobs (query: `search`, `employment_type`, `location`, `page`, `size`)
- `GET /api/jobs/{job_id}` — open job detail (`404` if not open)

## Applications (Week 3)

**Candidates** (`candidate` or `admin` role):

- `POST /api/jobs/{job_id}/apply` — apply to an **open** job (409 if already applied; 400 if you own the posting)
- `GET /api/candidate/applications` — list your applications with job title, company, stage, timestamps

**Recruiters** (`recruiter` or `admin` role):

- `GET /api/recruiter/applications` — all applications across your postings (admins see all)
- `GET /api/recruiter/jobs/{job_id}/applications` — applicants for one job
- `PATCH /api/recruiter/applications/{application_id}` — body `{ "stage": "applied" | "screening" | "interview" | "offer" | "rejected" }`

Recruiter job list/detail (`GET /api/recruiter/jobs`) includes **`applicants_count`** from stored applications.

## Week 1 — Completed by Abdellah

- Signup, email OTP verification, signin (password + OTP)
- Optional unique **phone** on signup (email + phone uniqueness); signup form EN + AM i18n; admin users table shows phone column
- Refresh token rotation with session persistence
- Forgot / reset password flow (single-use tokens, email delivery)
- Account lockout after 5 failed sign-in attempts (15 min, 30 min attempt window)
- In-memory rate limiting on sensitive endpoints
- Role-based access control (candidate, recruiter, admin) — normalized **`roles`** table + **`users.role_id`** FK; API still exposes `role` as a string
- Audit logging (signup, signin, verify, refresh, reset events, **`auth.locked`** when locked after max failures)
- Composite index on `audit_logs` (`created_at`, `actor_id`, `action`); legacy column drift handled via `init_db` / `db_migrate` where needed
- Seed super admin via `apps/api/seed_admin.py` / `ensure_super_admin` on startup
- Frontend auth pages: Signin, Signup, ForgotPassword, ResetPassword, Unauthorized
- Client-side route guards: RequireAuth, GuestOnly, RequireRole
- Axios interceptor for automatic access token refresh
- i18n scaffolding with English and Amharic translations
- **Database:** Alembic migrations as source of truth; integration test for downgrade → upgrade on PostgreSQL
- **Observability:** structured request logging (`app.request` logger: method, path, status, duration; `X-Request-ID` response header)
- **44+** pytest integration tests (auth + admin + migrations + recruiter + public jobs); CI runs the suite against Postgres
