# Architecture

## Apps

### `apps/api`
- FastAPI application
- SQLAlchemy models (`User`, `OTP`)
- JWT auth + OTP verification/login
- SMTP email delivery (dev fallback to console logging)

### `apps/web`
- React + TypeScript + MUI
- Auth UI: signup, signin, OTP verify
- Axios API client with bearer token interceptor

## Docker

- `docker/api.Dockerfile`: backend image
- `docker/web.Dockerfile`: frontend image
- `docker/docker-compose.yml`: postgres + api + web

## Runtime

- API default local DB: SQLite (`sqlite:///./recruit.db`)
- Optional DB: PostgreSQL via docker compose
- Frontend talks to API via Vite proxy (`/api`) in dev

## CI/CD

- CI runs lint/build for api/web on push + PR
- CD builds and pushes both images to GHCR on main

## Scripts

- `scripts/run-backend.ps1`
- `scripts/run-frontend.ps1`
- `scripts/run-all.ps1`
- `scripts/free-ports.ps1`
- `scripts/free-ports.sh`
