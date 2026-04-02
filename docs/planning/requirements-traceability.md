# Requirements Traceability Matrix (SRS/SDS)

This matrix links requirement IDs to delivery priority, schedule, evidence, and status.

Status values:
- `not_started`
- `in_progress`
- `done`
- `deferred`

## Template

| Requirement ID | Summary | Priority | Planned Week | Owner | Evidence (tests/docs/path) | Status |
|---|---|---|---|---|---|---|
| FR-XX | Requirement summary | P0/P1/P2 | 1/2/3/4 | @owner | `path/to/test_or_doc` | not_started |

## Initial Mapping (current baseline)

| Requirement ID | Summary | Priority | Planned Week | Owner | Evidence (tests/docs/path) | Status |
|---|---|---|---|---|---|---|
| FR-01 | Recruiter criteria weights (`cv`, `exam`, `interview`) sum to 1.0 and are persisted with jobs | P0 | 2 | backend | `packages/database/src/recruit_database/criteria_weights.py`, `apps/api/tests/test_recruiter_jobs.py` | done |
| FR-03 | Candidate apply supports optional CV text and TF-IDF/cosine CV-job matching | P0 | 1 | backend | `packages/ai-engine/src/ai_engine/match.py`, `apps/api/tests/test_applications.py` | done |
| FR-APP-LIST | Candidate/recruiter application views expose CV similarity score | P0 | 1 | backend/web | `apps/api/app/candidate/routes.py`, `apps/api/app/recruiter/routes.py`, `apps/web/src/pages/candidate/CandidateApplicationsPage.tsx` | done |
| NFR-OPS-HEALTH | Service health endpoint available for runtime checks | P0 | 1 | backend | `apps/api/app/main.py` | done |
| NFR-TRACE-LOG | Structured request logging with request correlation ID | P0 | 2 | backend | `apps/api/app/main.py` | done |
| NFR-SEC-CI | CI validates backend/frontend quality gates | P0 | 1 | devops | `.github/workflows/ci.yml` | done |
| NFR-OPS-BACKUP | Postgres backup/restore runbook documented and rehearsal evidence tracked | P0 | 3 | devops | `docs/ops/backup-restore-runbook.md` | done |
| NFR-OPS-INCIDENT | Incident response and rollback runbooks documented | P0 | 3 | devops | `docs/ops/incident-runbook.md`, `docs/ops/release-rehearsal-checklist.md` | done |
| NFR-SEC-SCAN | Dependency vulnerability + secrets hygiene review attached to release evidence | P0 | 4 | backend/devops | `docs/ops/security-verification-checklist.md` | done |
| FR-EXAM | Exam authoring/submission/grading workflow | P1 | 3 | backend/web | `TBD` | not_started |
| FR-XAI | Explainable AI output for score breakdown and rationale | P1 | 4 | backend/web | `TBD` | not_started |
| NFR-FAIRNESS | Bias/fairness checks and audit trail policy | P2 | 4 | ai/backend | `TBD` | not_started |

## Update Process

1. Add every new SRS/SDS requirement row before implementation starts.
2. Keep `Priority` and `Planned Week` aligned with the release plan.
3. Do not mark `done` without a concrete evidence path.
4. For deferred items, add reason in PR description and update the backlog doc.
