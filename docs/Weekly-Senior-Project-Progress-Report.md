# Weekly Senior Project Implementation Progress Report

**Project title:** EAA Recruit — AI Recruitment Platform  

**Week number / date:** **Week 2** — completed week ending **Monday, March 30, 2026**  

**Repository:** [hopeIsCo0l/fyp103](https://github.com/hopeIsCo0l/fyp103) (GitHub)

**Status:** Week 2 objectives **completed** and merged to `main` (see PR [#11](https://github.com/hopeIsCo0l/fyp103/pull/11)).

---

## 1. Project summary for the week

**Week 2** focused on finishing the **admin user management** experience, tightening **backend quality** for continuous integration, and refreshing **project documentation** so the team can run and demo the stack consistently.

The **admin users** area now provides pagination, debounced search, role and verification filters (with URL query sync), user creation, a single **edit** dialog for profile fields, **CSV export**, **password reset** (temporary password shown once), and **session revocation**. **English and Amharic** UI strings were extended for these flows.

The API **startup path** and **initialization scripts** were aligned with the Docker-based workflow; **README.md** was reconciled with Docker-first run instructions from `main`. **Ruff** import rules (`I001`) were applied so the **GitHub Actions** backend lint step passes.

---

## 2. Features / modules implemented

| Module / feature | Description | Status | % completed | Remarks |
|------------------|-------------|--------|-------------|---------|
| Admin users UI | `AdminUsers.tsx`: filters, CRUD, CSV export, reset password, revoke sessions | Completed | 100% | React + MUI + i18n (`en` / `am`) |
| API & admin routes | FastAPI admin endpoints wired to existing JWT auth | Completed | 100% | See `app/admin/` |
| Backend startup | Consistent startup and init flow with the documented Docker setup | Completed | 100% | `main.py`, `init_db.py` |
| Automated tests | **34** backend tests (auth, admin, plus one integration check on PostgreSQL in CI) | Completed | 100% | `apps/api/tests/` |
| Docs & config | `ARCHITECTURE.md`, `README.md` (Docker, API), `.env.example` | Completed | 100% | Matches documented run order |
| Code quality | Ruff `E`, `F`, `I`, `W` on `apps/api/app` | Completed | 100% | CI: `ruff check app` |

---

## 3. Development progress details

- **Code developed:** Admin routes and `AdminUsers.tsx`; `main.py` and `init_db.py` alignment; `conftest` and admin test updates; merge resolution for `README.md` and scripts (`docker-up.ps1`, `free-ports.ps1`, `AGENTS.md`, `.gitignore`).
- **Tools / languages used:** Python 3.12 (FastAPI, SQLAlchemy 2, pytest), TypeScript (React, Vite), MUI, react-i18next, Docker Compose, Git, GitHub Actions, Ruff.
- **Integration:** Admin UI uses the JWT-protected admin API; backend tests run in CI against a **PostgreSQL** service; local parity via Compose (`localhost:5433`).
- **Version control (`main`):**
  - `6c45f25` — `feat(api): … admin users and docs (#11)` (squash merge closing Week 2 deliverables)
  - Earlier admin line: `865c0b2` (candidate role on create, #5), `f9137aa` / `76e0c3a` / `c2af3ab` (consolidated edit, tests, PRs #8–#9).

---

## 4. Testing / verification conducted

- **Automated (pytest):** **34** tests under `apps/api/tests` — **31** auth (`test_auth.py`), **2** admin (`test_admin.py`), **1** integration check requiring PostgreSQL in CI.
- **Manual / integration:** Admin list/filter, create/edit user, CSV export, password reset, revoke sessions, with API + web (Docker or host scripts).
- **Issues encountered:**
  - **Merge conflict** on `README.md` when aligning the feature branch with `main` — resolved by merging Docker run instructions with the API contract section.
  - **CI:** Ruff **I001** (import order) on `ruff check app` — fixed with `ruff check app --fix` and `ruff format app`.
- **Bug fixes / improvements:** Import ordering in `app/admin/routes.py`, `app/auth/routes.py`, `app/auth/security.py`, and related backend modules; README updated to match the current startup and admin behavior.

---

## 5. Challenges / issues encountered

| Area | Detail | Outcome |
|------|--------|---------|
| Branch integration | `main` vs feature branch differences (`README`, scripts) | Resolved before merge to `main` |
| CI | Ruff import rules | Fixed; backend workflow passes |
| Environment | One integration test requires PostgreSQL in CI | Handled; skipped where the test DB is not Postgres |

**Open for later phases:** production SMTP, secret management, and deployment runbooks.

---

## 6. Support / guidance needed

- **Optional:** Clarify **Week 3** priorities for recruitment-domain features (jobs, candidates, AI-assisted matching) against the course calendar.
- **Optional:** Confirm demo or checkpoint dates with the supervisor when scheduled.

---

## 7. Plan for next week (Week 3)

- Begin or extend **recruitment** features per the project proposal (entities, APIs, UI as prioritized).
- Keep **tests** and **CI** green (Ruff, pytest, frontend lint/build on PRs).
- Update **README** / **ARCHITECTURE** when behavior or environment variables change.

---

## 8. Additional notes / comments

- **Architecture:** See `ARCHITECTURE.md` (monorepo apps, Docker).
- **Local dev:** From repo root — `.\scripts\run-backend.ps1` and `.\scripts\run-frontend.ps1` (`AGENTS.md`). Full stack: `.\scripts\free-ports.ps1` then `.\scripts\docker-up.ps1` (`README.md`).
- **Week 2 feature merge:** [#11](https://github.com/hopeIsCo0l/fyp103/pull/11).
- **Earlier documentation update for this report:** [#13](https://github.com/hopeIsCo0l/fyp103/pull/13).

---

## Sign-off

| Student name | Signature | Date |
|--------------|-----------|------|
| Abdellah Teshome | _______________ | March 30, 2026 |
| Abdurezak Zeynu | _______________ | March 30, 2026 |
| Binyam Dagne | _______________ | March 30, 2026 |
| Rohobot Melaku | _______________ | March 30, 2026 |

---

*Submit as PDF or printed form if the course requires; this Markdown file is the working draft.*
