# Weekly Senior Project Implementation Progress Report

**Project title:** FYP103 — AI Recruitment Platform  

**Week number / date:** Week ending **Monday, March 25, 2026**  

**Repository:** [hopeIsCo0l/fyp103](https://github.com/hopeIsCo0l/fyp103) (GitHub)

---

## 1. Project summary for the week

This week delivered **versioned database migrations (Alembic)**, a **consolidated admin users** experience, **documentation** updates, and **CI-aligned** backend style.

The API runs **Alembic** (`alembic upgrade head`) on startup via `app/db_startup.py`, then applies **legacy PostgreSQL patches** (`app/db_migrate.py`) and **super-admin seeding** (`ensure_super_admin`), so schema and data stay consistent in Docker and local Postgres (unless `SKIP_STARTUP_DB` is set).

The **admin users** screen supports pagination, debounced search, role and verification filters (with URL query sync), user creation and a single **edit** dialog for profile fields, **CSV export**, **password reset** (temporary password shown once), and **session revocation**. English and Amharic **i18n** were extended for these flows.

**Delivery:** Core implementation merged to `main` via **pull request #11** (squash merge `6c45f25`). During integration, **README.md** was reconciled with Docker-first run instructions from `main`, and **Ruff** import rules (`I001`) were satisfied so **GitHub Actions** backend lint passes.

---

## 2. Features / modules implemented

| Module / feature | Description | Status | % completed | Remarks |
|------------------|-------------|--------|-------------|---------|
| Alembic migrations | Initial revision `001_initial_schema`, `alembic.ini`, `alembic/env.py`; `run_alembic_upgrade()` | Completed | 100% | Works with `db_migrate` patches; see `ARCHITECTURE.md` |
| API / DB startup | `main.py`: Alembic → `run_postgresql_migrations` → `ensure_super_admin` | Completed | 100% | `init_db.py` uses the same sequence |
| Admin users UI | `AdminUsers.tsx`: filters, CRUD, CSV export, reset password, revoke sessions | Completed | 100% | React + MUI + i18n (`en` / `am`) |
| Automated tests | `test_migrations.py`: downgrade to base then upgrade to head (PostgreSQL) | Completed | 100% | Skipped when the test DB is not PostgreSQL |
| Docs & config | `ARCHITECTURE.md`, `README.md` (Docker, API, migrations), `.env.example` | Completed | 100% | Matches current startup order |
| Code quality | Ruff `E`, `F`, `I`, `W` on `apps/api/app` | Completed | 100% | CI: `ruff check app` in `.github/workflows/ci.yml` |

---

## 3. Development progress details

- **Code developed:** `app/db_startup.py`; `apps/api/alembic/` (initial revision); `app/main.py` and `init_db.py` wiring; admin routes and `AdminUsers.tsx`; `tests/test_migrations.py`; `conftest` and admin test updates; merge resolution for `README.md` and scripts (`docker-up.ps1`, `free-ports.ps1`, `AGENTS.md`, `.gitignore`).
- **Tools / languages used:** Python 3.12 (FastAPI, SQLAlchemy 2, Alembic, pytest), TypeScript (React, Vite), MUI, react-i18next, Docker Compose, Git, GitHub Actions, Ruff.
- **Integration:** Admin UI uses JWT-protected admin API; migrations run in CI against a **PostgreSQL** service container; local parity via Compose (`localhost:5433` → Postgres in `docker-compose.yml`).
- **Version control (`main`):**
  - `6c45f25` — `feat(api): Alembic migrations on startup; admin users and docs (#11)` (squash merge of feature branch work)
  - Prior related commits on the line to admin: `865c0b2` (candidate role on create, #5), `f9137aa` / `76e0c3a` / `c2af3ab` (admin consolidate edit, test fixes, earlier PRs #8–#9).

---

## 4. Testing / verification conducted

- **Automated (pytest):** **34** tests under `apps/api/tests` — **31** in `test_auth.py`, **2** in `test_admin.py`, **1** in `test_migrations.py`. CI runs the full backend job with Postgres.
- **Manual / integration:** Recommended: admin list/filter, create/edit user, CSV export, password reset, revoke sessions, with API + web running (Docker or host scripts).
- **Issues encountered:**
  - **Merge conflict** on `README.md` when aligning feature branch with `main` — resolved by merging Docker run instructions with accurate migration and API contract sections.
  - **CI:** Ruff **I001** (import order) failing `ruff check app` — fixed with `ruff check app --fix` and `ruff format app` before merge.
- **Bug fixes / improvements:** Import ordering in `app/admin/routes.py`, `app/auth/routes.py`, `app/auth/security.py`, `app/db_migrate.py`, `app/db_startup.py`; README reflects Alembic + `db_migrate` + seed order.

---

## 5. Challenges / issues encountered

| Area | Detail | Outcome |
|------|--------|---------|
| Technical | Ordering Alembic vs legacy `db_migrate` patches | Documented in `README.md` and `ARCHITECTURE.md` |
| Branch integration | `main` vs feature branch differences (`README`, scripts) | Resolved before merge to `main` |
| CI | Ruff import rules | Fixed; backend workflow passes |
| Environment | `test_migrations` needs PostgreSQL | Test skipped on non-Postgres engines |

**Open for later phases:** production SMTP, secret management, and whether migrations should run only in a deploy job vs on API startup (policy decision with supervisor/ops).

---

## 6. Support / guidance needed

- **Optional:** Supervisor sign-off on **production migration strategy** (dedicated migration step vs startup migrations).
- **Optional:** Clarify **next milestone** for recruitment-domain features (jobs, candidates, AI-assisted matching) against the course calendar.

---

## 7. Plan for next week

- Implement or extend **recruitment** features per the project proposal (entities, APIs, UI as prioritized).
- Maintain **test coverage** and **CI** (Ruff, pytest, frontend lint/build on PRs).
- Update **README** / **ARCHITECTURE** when behavior or environment variables change.
- Track **course deadlines** (demo, report submission) when announced; add dates here if required.

---

## 8. Additional notes / comments

- **Architecture:** See `ARCHITECTURE.md` (monorepo apps, Docker, schema notes).
- **Local dev:** From repo root — `.\scripts\run-backend.ps1` and `.\scripts\run-frontend.ps1` (`AGENTS.md`). Full stack: `.\scripts\free-ports.ps1` then `.\scripts\docker-up.ps1` (`README.md`).


---

## Sign-off

| Student name | Signature | Date |
|--------------|-----------|------|
| Abdellah Teshome| _______________ | March 25, 2026 |
| Abdurezak Zeynu | _______________ | March 25, 2026 |
| Binyam Dagne    | _______________ | March 25, 2026 |
| Rohobot Melaku  | _______________ | March 25, 2026 |

---

*Submit as PDF or printed form if the course requires; this Markdown file is the working draft.*
