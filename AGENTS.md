# Root scripts reference

Run from repository root.

- **Production-like stack (preferred):** `./scripts/docker-up.ps1` (or `cd docker` and `docker compose up --build`).
- **Optional host-only (debug / CI-style):** `./scripts/run-backend.ps1`, `./scripts/run-frontend.ps1` — see README; use Docker + PostgreSQL for realistic parity.
