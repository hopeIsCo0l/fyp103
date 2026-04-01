# P0 Release Signoff (Strict Production-Ready)

## Scope

This signoff references:
- `docs/release/p0-scope-checklist.md`
- `docs/planning/requirements-traceability.md`
- `docs/ops/*` runbooks/checklists

## Validation Evidence

| Area | Evidence | Result | Notes |
|---|---|---|---|
| Backend lint | `python -m ruff check apps/api/app` | pass | Completed 2026-04-01 |
| Weighted scoring behavior | `docs/planning/weighted-scoring.md`, `apps/api/tests/test_applications.py` | pass | `pytest apps/api/tests/test_applications.py -q` -> 6 passed |
| API health endpoint | `GET /health` (`apps/api/app/main.py`) | pass | Static endpoint |
| API readiness endpoint | `GET /ready` (`apps/api/app/main.py`) | pass | Live probe -> 200 with Postgres healthy |
| Backup/restore runbook | `docs/ops/backup-restore-runbook.md` | pass | Backup + restore rehearsal evidence recorded (2026-04-01) |
| Incident runbook | `docs/ops/incident-runbook.md` | pass (doc) | Includes escalation and postmortem template |
| Release/rollback checklist | `docs/ops/release-rehearsal-checklist.md` | pass | Local staging-like rehearsal completed |
| Monitoring/log checklist | `docs/ops/monitoring-log-checklist.md` | pass | Signoff row recorded |
| Security verification + dependency scan | `docs/ops/security-verification-checklist.md` | pass with exception | Backend dependency CVEs documented with P1 remediation owner/window |
| Frontend quality gate | `cd apps/web && npm run lint && npm run build` | pass | Completed 2026-04-01 |
| Auth smoke tests | `pytest apps/api/tests/test_auth.py -q` | pass | 31 passed |

## Open Preconditions Before Production Cut

None. Remaining risk is tracked as an explicit release exception:
- Backend dependency CVEs from `pip-audit` (`python-jose`, `python-multipart`, `starlette`) are accepted for this cut and scheduled in `docs/release/p1-p2-backlog.md` (security dependency remediation row).

## Approvals

| Role | Name | Date | Decision |
|---|---|---|---|
| Engineering lead | Abdel | 2026-04-01 | approve with security exception |
| QA/test owner | Abdel | 2026-04-01 | approve with security exception |
| Ops/release owner | Abdel | 2026-04-01 | approve with security exception |
