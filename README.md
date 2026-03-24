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

## Auth Endpoints

- `POST /api/auth/signup`
- `POST /api/auth/verify-email`
- `POST /api/auth/resend-otp`
- `POST /api/auth/signin`
- `POST /api/auth/request-login-otp`
- `POST /api/auth/verify-login-otp`
- `GET /api/auth/me`
