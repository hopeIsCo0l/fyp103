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
├─ packages/                  # Reserved for shared libs
├─ scripts/
├─ .github/workflows/
├─ ARCHITECTURE.md
└─ README.md
```

<!-- ## Quick Start (Local, No Docker)

### Terminal 1 - API

```powershell
.\scripts\run-backend.ps1
```

### Terminal 2 - Web

```powershell
.\scripts\run-frontend.ps1
```

Open:
- Web: http://localhost:5173
- API docs: http://localhost:8000/docs -->

## Quick Start (Docker)

```powershell
.\scripts\free-ports.ps1
docker-compose -f .\docker\docker-compose.yml up --build
```

Services:
- Web: http://localhost:5173
- API: http://localhost:8000/docs
- PostgreSQL: localhost:5433

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

## Week 1 — Completed by Abdellah

- Signup, email OTP verification, signin (password + OTP)
- Refresh token rotation with session persistence
- Forgot / reset password flow (single-use tokens, email delivery)
- Account lockout after 5 failed sign-in attempts (15 min)
- In-memory rate limiting on all sensitive endpoints
- Role-based access control (candidate, recruiter, admin)
- Audit logging (signup, signin, verify, refresh, reset events)
- Frontend auth pages: Signin, Signup, ForgotPassword, ResetPassword, Unauthorized
- Client-side route guards: RequireAuth, GuestOnly, RequireRole
- Axios interceptor for automatic access token refresh
- i18n scaffolding with English and Amharic translations
- **Database:** Alembic migrations (`apps/api/alembic/`) as the source of truth; `init_db.py` runs `alembic upgrade head` plus legacy PostgreSQL patches (`app/db_migrate.py`). Rollback: `cd apps/api && alembic downgrade -1` (or `downgrade base` to empty). Integration test `test_migrations.py` exercises downgrade → upgrade.
- **Observability:** structured request logging (`app.request` logger: method, path, status, duration; `X-Request-ID` response header)
- **34** pytest tests (auth + admin + migration round-trip); CI runs the full suite against Postgres

## Database migrations (local)

From `apps/api` with `DATABASE_URL` set (e.g. Docker Postgres on port 5433):

```powershell
cd apps/api
python -m alembic upgrade head
```

Or: `python init_db.py` (upgrade + legacy patches).
