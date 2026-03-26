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

- **Primary:** PostgreSQL via Docker Compose (`docker/docker-compose.yml`) — same engine and topology as production-like deployments.
- **Tests / optional host workflows:** SQLite (`sqlite:///./recruit.db`) is used in pytest and may appear in local `.env` for isolated runs; it is not the reference runtime for the product.
- Frontend talks to the API via the Vite dev proxy (`/api`) when using the compose stack.

## CI/CD

- CI runs lint/build for api/web on push + PR
- CD builds and pushes both images to GHCR on main

## Scripts

- `scripts/docker-up.ps1` — copy `docker/.env` if needed and start Compose (preferred).
- `scripts/free-ports.ps1` / `scripts/free-ports.sh` — avoid port clashes before Compose.
- `scripts/run-backend.ps1` / `scripts/run-frontend.ps1` / `scripts/run-all.ps1` — optional host-side processes (see README); not a substitute for the Docker stack.
