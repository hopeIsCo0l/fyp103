# Weekly Senior Project Implementation Progress Report

**Project title:** FYP103 — AI Recruitment Platform  

**Week number / date:** Week ending **Monday, March 30, 2026**  

---

## 1. Project summary for the week

This week delivered **versioned database migrations**, a **consolidated admin users** experience, **documentation** aligned with `main`, and **CI hygiene**.

The API runs **Alembic** (`alembic upgrade head`) on startup via `app/db_startup.py`, then applies **legacy PostgreSQL patches** (`app/db_migrate.py`) and **super-admin seeding**, so schema and data stay consistent in Docker and local Postgres.

The **admin users** screen supports pagination, debounced search, role and verification filters (with URL query sync), user creation and a single **edit** dialog for profile fields, **CSV export**, **password reset** (with temporary password shown once), and **session revocation**. Copy-to-clipboard and English/Amharic **i18n** were updated.

**Git:** Feature work was merged with `origin/main` (Docker run scripts, `docker-up.ps1`, `.gitignore`, `AGENTS.md`); **README.md** conflicts were resolved manually. **GitHub Actions** backend lint was fixed by applying **Ruff** import order and format on `apps/api/app`.

---

## 2. Features / modules implemented

| Module / feature | Description | Status | % completed | Remarks |
|------------------|-------------|--------|-------------|---------|
| Alembic migrations | Initial revision `001_initial_schema`, `alembic.ini`, `alembic/env.py`; `run_alembic_upgrade()` | Completed | 100% | Complements `db_migrate` patches; see `ARCHITECTURE.md` |
| API / DB startup | `main.py`: Alembic → `run_postgresql_migrations` → `ensure_super_admin` (unless `SKIP_STARTUP_DB`) | Completed | 100% | `init_db.py` uses the same sequence |
| Admin users UI | `AdminUsers.tsx`: filters, CRUD, export, reset password, revoke sessions; admin API client | Completed | 100% | React + MUI + i18n |
| Automated tests | `test_migrations.py`: downgrade to base then upgrade to head on PostgreSQL | Completed | 100% | Skipped when DB is not PostgreSQL |
| Docs & config | `ARCHITECTURE.md`, merged `README.md` (Docker + API + migrations), `docs/` weekly report, `.env.example` | Completed | 100% | Documents match current startup order |
| Code quality | Ruff `I` (isort) compliance on touched API modules | Completed | 100% | Fixes CI `ruff check app` |

---

## 3. Development progress details

- **Code developed:** `app/db_startup.py`; Alembic layout under `apps/api/alembic/`; `app/main.py` and `init_db.py` wiring; admin routes and web admin page; `tests/test_migrations.py`; merge resolution for `README.md` and related scripts from `main`.
- **Tools / languages used:** Python 3.12 (FastAPI, SQLAlchemy 2, Alembic, pytest), TypeScript (React, Vite), MUI, react-i18next, Docker Compose, Git, GitHub Actions, Ruff.
- **Integration:** Admin UI calls existing JWT-protected admin API; migrations run against PostgreSQL in CI (service container) and in local/Docker setups.
- **Version control (branch `feat/admin-users-consolidated-edit`):**
  - `0fb7c40` — `feat(api): Alembic migrations on startup; admin users and docs`
  - `a560203` — `Merge origin/main into feat/admin-users-consolidated-edit` (README + upstream script changes)
  - `baec5ec` — `style(api): fix Ruff I001 import order and format`
  - Earlier related work on branch: admin consolidate edit, admin password reset UI, PostgreSQL-only tests, candidate role on create (see full `git log`).

---

## 4. Testing / verification conducted

- **Unit / automated (pytest):** **34** tests in `apps/api/tests` — **31** auth flows (`test_auth.py`), **2** admin (`test_admin.py`), **1** Alembic round-trip (`test_migrations.py`). CI runs the backend suite with a **PostgreSQL** service.
- **Integration / manual:** Admin flows (list, filter, create, edit, CSV export, password reset, revoke sessions) against running API recommended for UX and SMTP-dependent email (Mailtrap in dev).
- **Issues found during testing / CI:**
  - **Merge conflict** on `README.md` when merging `main` — resolved by combining Docker instructions from `main` with accurate migration and API sections.
  - **CI failure:** Ruff **I001** (import organization) on `ruff check app` — fixed with `ruff check app --fix` and `ruff format app`, then committed.
- **Bug fixes / improvements:** Import ordering and formatting across `app/admin/routes.py`, `app/auth/routes.py`, `app/auth/security.py`, `app/db_migrate.py`, `app/db_startup.py` so CI passes; README now reflects actual startup and migration behavior.

---

## 5. Challenges / issues encountered

| Area | Detail | Outcome |
|------|--------|---------|
| Technical | Aligning Alembic revisions with legacy `db_migrate` steps and documenting order for developers | Addressed in `README.md` and `ARCHITECTURE.md` |
| Technical | Divergence between `main` and feature branch (`README.md`, scripts) | Resolved via merge commit and unified README |
| CI | Ruff strict import rules failing the backend job | Fixed and pushed (`baec5ec`) |
| Environment | Migration integration test requires PostgreSQL; not run on SQLite | Accepted; test marked skip when backend is not Postgres |

**Still open (typical for later phases):** production SMTP, secrets management, whether migrations run only in deploy pipeline vs on every API start (team/supervisor policy).

---

## 6. Support / guidance needed

- **Optional:** Confirm with the supervisor whether **production** should run migrations in a **release job** only, or keep **startup migrations** for simplicity (trade-off: deploy speed vs operational control).
- **Optional:** Prioritize next vertical slice for the **recruitment AI** scope (e.g. job postings, candidate profiles, matching) if the course timeline requires a demo milestone.

---

## 7. Plan for next week

- Continue **core recruitment features** per project scope (e.g. job or candidate entities, dashboards, or AI-assisted flows as defined in the proposal).
- Add or extend **tests** for new endpoints and critical UI paths; keep **CI green** (Ruff, pytest, frontend lint/build).
- Keep **documentation** (`README`, `ARCHITECTURE`) updated when behavior or env vars change.
- **Milestones:** Align with course deadlines for mid-term or demo dates as announced by the instructor *(adjust dates when confirmed)*.

---

## 8. Additional notes / comments

- Architecture overview: `ARCHITECTURE.md` (apps, Docker ports, schema/migration notes).
- Local development: `.\scripts\run-backend.ps1` and `.\scripts\run-frontend.ps1` from repo root (`AGENTS.md`); full stack: `.\scripts\free-ports.ps1` then `.\scripts\docker-up.ps1` per merged `README.md`.
- Pull request **#11** on GitHub tracks this feature branch; after merge to `main`, tag or note the release for the weekly record if required by the course.

---

## Sign-off

| Student name | Signature | Date |
|--------------|-----------|------|
| Abdellah | _______________ | March 30, 2026 |

---

*Course staff may request a PDF export or supervisor signature on a printed form; this file is the source draft.*
