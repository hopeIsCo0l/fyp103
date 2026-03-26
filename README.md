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

## Quick Start (Local, No Docker)

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
- API docs: http://localhost:8000/docs

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

- CI: `.github/workflows/ci.yml` (lint + build api/web)
- CD: `.github/workflows/cd.yml` (build/push Docker images to GHCR)

## Database migrations

- **Runtime:** On API startup, `app/main.py` runs `Base.metadata.create_all` then `run_post_create_all` (legacy `users.role` → `role_id` migration when needed, seed `roles` rows).
- **Manual / CI:** From `apps/api` with `DATABASE_URL` set (and dependencies installed):

  ```powershell
  alembic upgrade head
  ```

  First revision (`0001_bootstrap`) runs the same legacy role migration + `ensure_roles`. **Tables must exist** (run `python init_db.py` or start the API once) before Alembic can apply data-only steps on an empty file DB.

- **Roles:** `roles` table (`candidate`, `recruiter`, `admin`); `users.role_id` foreign key. API responses still expose `role` as a string (role code).

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
- Optional unique **phone** on signup (email + phone uniqueness)
- Refresh token rotation with session persistence
- Forgot / reset password flow (single-use tokens, email delivery)
- Account lockout after 5 failed sign-in attempts (15 min, 30 min attempt window)
- In-memory rate limiting on all sensitive endpoints
- Role-based access control (candidate, recruiter, admin) — normalized **`roles`** table + **`users.role_id`** FK
- Audit logging (signup, signin, verify, refresh, reset events, **`auth.locked`** when an account is locked after max failures)
- Composite index on `audit_logs` (`created_at`, `actor_id`, `action`); `init_db.py` for SQLite column migrations
- Seed super admin via `apps/api/seed_admin.py`
- Frontend auth pages: Signin, Signup, ForgotPassword, ResetPassword, Unauthorized
- Client-side route guards: RequireAuth, GuestOnly, RequireRole
- Axios interceptor for automatic access token refresh
- i18n scaffolding with English and Amharic translations
- Signup form: optional **phone** field (EN + AM i18n); admin users table shows phone column
- **Alembic** (`alembic.ini`, `alembic/env.py`, revision `0001_bootstrap`) for versioned DB steps
- 31 pytest integration tests covering the full auth surface
- CI pipeline with lint, build, and pytest steps
