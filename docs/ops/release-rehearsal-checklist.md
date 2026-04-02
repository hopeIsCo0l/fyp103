# Release Rehearsal and Rollback Checklist

Use this checklist before production cut.

## Pre-Deployment

- [x] Branch and commit hash frozen for release candidate.
- [x] CI pipeline green (backend + frontend).
- [x] Alembic migrations reviewed for forward/backward safety.
- [x] Backup taken and verified (`docs/ops/backup-restore-runbook.md`).
- [x] Runbooks reviewed by incident lead.

## Deployment Rehearsal (staging-like)

- [x] Deploy images/stack using release candidate artifacts.
- [x] Run migration step (`alembic upgrade head`).
- [ ] Validate API:
  - [x] `/health` returns 200.
  - [x] `/ready` returns 200.
  - [x] Auth smoke test.
  - [x] Recruiter job CRUD smoke test.
  - [x] Candidate apply smoke test.
- [ ] Validate frontend:
  - [x] Auth/login pages load.
  - [x] Candidate jobs/applications page loads.
  - [x] Recruiter jobs/applicants page loads.

## Rollback Rehearsal

- [x] Confirm last known-good image/tag.
- [x] Revert app deployment to previous version.
- [x] Validate API and frontend smoke checks on rolled-back version.
- [x] Restore DB from backup in a non-production environment and validate integrity.

## Signoff

| Role | Name | Date | Decision |
|---|---|---|---|
| Engineering lead | Abdel | 2026-04-01 | approve with security exception |
| QA/test owner | Abdel | 2026-04-01 | approve with security exception |
| Ops/release owner | Abdel | 2026-04-01 | approve with security exception |

## Evidence Notes (2026-04-01)

- API checks: `GET /health` -> 200, `GET /ready` -> 200.
- Backend smoke: `apps/api/venv311/Scripts/python.exe -m pytest apps/api/tests/test_auth.py -q` (31 passed), `... test_applications.py -q` (6 passed).
- Frontend quality gate: `cd apps/web && npm run lint && npm run build` (pass).
- DB rollback rehearsal: `pg_dump` + `pg_restore --clean --if-exists` validated in local Docker Postgres.
- Formal migration verification evidence: `docs/ops/migration-verification.md` (`base -> head` and `003 -> head` scenarios passed).
- Week-2 bundled evidence: `docs/ops/week2-p0-ai-scoring-data-reliability-evidence.md`.
