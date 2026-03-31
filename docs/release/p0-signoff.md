# P0 Release Signoff (Strict Production-Ready)

## Scope

This signoff references:
- `docs/release/p0-scope-checklist.md`
- `docs/planning/requirements-traceability.md`
- `docs/ops/*` runbooks/checklists

## Validation Evidence

| Area | Evidence | Result | Notes |
|---|---|---|---|
| Backend lint | `cd apps/api && python -m ruff check app` | pass | Completed in this cycle |
| Weighted scoring behavior | `docs/planning/weighted-scoring.md`, `apps/api/tests/test_applications.py` | pass (code+tests updated) | Integration tests require running Postgres |
| API health endpoint | `GET /health` (`apps/api/app/main.py`) | pass | Static endpoint |
| API readiness endpoint | `GET /ready` (`apps/api/app/main.py`) | pass (code) | Returns 503 when DB unavailable |
| Backup/restore runbook | `docs/ops/backup-restore-runbook.md` | pass (doc) | Rehearsal evidence table to fill during drill |
| Incident runbook | `docs/ops/incident-runbook.md` | pass (doc) | Includes escalation and postmortem template |
| Release/rollback checklist | `docs/ops/release-rehearsal-checklist.md` | pass (doc) | Requires staging rehearsal execution |
| Monitoring/log checklist | `docs/ops/monitoring-log-checklist.md` | pass (doc) | Includes runtime/log quality checks |

## Open Preconditions Before Production Cut

1. Start Postgres and run integration tests:
   - `cd apps/api`
   - `python -m pytest tests/test_applications.py -q`
2. Execute backup/restore rehearsal and fill evidence row.
3. Execute staging release rehearsal and rollback checklist.
4. Record final approvers in this file.

## Approvals

| Role | Name | Date | Decision |
|---|---|---|---|
| Engineering lead |  |  | pending |
| QA/test owner |  |  | pending |
| Ops/release owner |  |  | pending |
