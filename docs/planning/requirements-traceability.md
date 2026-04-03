# Requirements Traceability Matrix (SRS/SDS)

This matrix links requirement IDs from `docs/recruitment-backlog.md` to priority, schedule, implementation evidence, and status.

Status values:
- `not_started`
- `in_progress`
- `done`
- `deferred`

## Template

| Requirement ID | Legacy Crosswalk (optional) | Summary | Priority | Planned Week | Owner | Evidence (tests/docs/path) | Status |
|---|---|---|---|---|---|---|---|
| FR-XX / NFR-XX / AFR-XX | legacy-id-or-feature-name | Requirement summary | P0/P1/P2 | 1/2/3/4 | @owner | `path/to/test_or_doc` | not_started |

## Comprehensive Mapping (full ID coverage)

Notes:
- Every `FR-*`, `NFR-*`, and `AFR-*` from `docs/recruitment-backlog.md` is listed.
- `Legacy Crosswalk` preserves references used in earlier plans/PRs.
- Use `deferred` when an item is intentionally moved beyond the current release slice.

| Requirement ID | Legacy Crosswalk (optional) | Summary | Priority | Planned Week | Owner | Evidence (tests/docs/path) | Status |
|---|---|---|---|---|---|---|---|
| FR-01 | legacy-auth-signup | User registration | P0 | 1 | backend/web | `apps/api/app/auth/routes.py`, `apps/api/tests/test_auth.py` | done |
| FR-02 | legacy-auth-signin | User login | P0 | 1 | backend/web | `apps/api/app/auth/routes.py`, `apps/api/tests/test_auth.py` | done |
| FR-03 | legacy-auth-logout | User logout | P0 | 1 | backend/web | `apps/api/app/auth/routes.py`, `apps/api/tests/test_auth.py` | done |
| FR-04 | legacy-auth-forgot-password | Password reset request | P0 | 1 | backend/web | `apps/api/app/auth/routes.py`, `apps/api/tests/test_auth.py` | done |
| FR-05 | legacy-auth-reset-password | Password reset completion | P0 | 1 | backend/web | `apps/api/app/auth/routes.py`, `apps/api/tests/test_auth.py` | done |
| FR-06 | legacy-auth-me-profile | View/update profile | P0 | 1 | backend/web | `apps/api/app/auth/routes.py`, `apps/api/app/auth/schemas.py`, `apps/api/tests/test_auth.py`, `apps/web/src/api/auth.ts`, `apps/web/src/pages/shared/ProfilePage.tsx` | done |
| FR-07 | legacy-rbac | Role-based access control | P0 | 1 | backend | `apps/api/app/auth/dependencies.py`, `apps/api/tests/test_auth.py` | done |
| FR-08 | legacy-recruiter-job-create | Create new request (mapped to recruiter job creation) | P0 | 2 | backend/web | `apps/api/app/recruiter/routes.py`, `apps/api/tests/test_recruiter_jobs.py` | done |
| FR-09 | legacy-draft-save | Save request as draft | P1 | 3 | backend/web | `TBD` | not_started |
| FR-10 | legacy-draft-edit | Edit draft request | P1 | 3 | backend/web | `TBD` | not_started |
| FR-11 | legacy-candidate-apply | Submit request (mapped to candidate apply flow) | P0 | 1 | backend/web | `apps/api/app/candidate/routes.py`, `apps/api/tests/test_applications.py` | done |
| FR-12 | legacy-request-validation | Validate request fields | P0 | 2 | backend/web | `apps/api/app/schemas.py`, `apps/api/tests/test_recruiter_jobs.py` | done |
| FR-13 | legacy-attachments | Attach supporting documents | P1 | 3 | backend/web | `TBD` | not_started |
| FR-14 | legacy-application-details | View request details | P0 | 1 | backend/web | `apps/api/app/candidate/routes.py`, `apps/api/app/recruiter/routes.py`, `apps/web/src/pages/candidate/CandidateApplicationsPage.tsx` | done |
| FR-15 | legacy-open-job-browse | Search requests (mapped to open jobs browse/search) | P0 | 2 | backend/web | `apps/api/app/jobs/routes.py`, `apps/web/src/pages/candidate/OpenJobsPage.tsx` | in_progress |
| FR-16 | legacy-score-sort-filter | Filter and sort request list | P1 | 3 | web | `apps/web/src/pages/recruiter/RecruiterApplicationsPage.tsx` | not_started |
| FR-17 | legacy-status-timeline | View request status history | P1 | 3 | backend/web | `TBD` | not_started |
| FR-18 | legacy-approve | Approve request | P1 | 3 | backend/web | `TBD` | not_started |
| FR-19 | legacy-reject | Reject request | P1 | 3 | backend/web | `TBD` | not_started |
| FR-20 | legacy-return-correction | Return request for correction | P1 | 3 | backend/web | `TBD` | not_started |
| FR-21 | legacy-reassign | Reassign request | P2 | 4 | backend/web | `TBD` | deferred |
| FR-22 | legacy-escalation | Escalate overdue request | P2 | 4 | backend/devops | `TBD` | deferred |
| FR-23 | legacy-comments | Add comment/internal note | P2 | 4 | backend/web | `TBD` | deferred |
| FR-24 | legacy-status-notify | Notify user on status change | P1 | 4 | backend | `apps/api/app/auth/otp.py`, `apps/api/app/auth/routes.py` | in_progress |
| FR-25 | legacy-reminders | Send reminder notifications | P2 | 4 | backend/devops | `TBD` | deferred |
| FR-26 | legacy-reports | Generate reports | P2 | 4 | backend/web | `TBD` | deferred |
| FR-27 | legacy-export-reports | Export reports | P2 | 4 | backend/web | `TBD` | deferred |
| FR-28 | legacy-dashboard-kpis | View dashboard summary | P1 | 4 | web | `TBD` | not_started |
| FR-29 | legacy-admin-users | Manage user accounts | P0 | 2 | backend/web | `apps/api/app/admin/routes.py`, `apps/api/tests/test_admin.py`, `apps/web/src/pages/admin/AdminUsers.tsx` | done |
| FR-30 | legacy-admin-rbac-config | Manage roles and permissions | P1 | 4 | backend/web | `apps/api/app/admin/routes.py`, `apps/web/src/pages/admin/AdminUsers.tsx` | in_progress |
| FR-31 | legacy-reference-data | Manage reference data | P2 | 4 | backend/web | `TBD` | deferred |
| FR-32 | legacy-archive | Archive closed records | P2 | 4 | backend | `TBD` | deferred |
| FR-33 | legacy-reopen | Reopen closed record | P2 | 4 | backend | `TBD` | deferred |
| FR-34 | legacy-dedup | Prevent duplicate records | P0 | 2 | backend | `apps/api/tests/test_applications.py` | in_progress |
| FR-35 | legacy-sla-deadline | Track SLA/deadline compliance | P2 | 4 | backend/devops | `TBD` | deferred |
| FR-36 | NFR-TRACE-LOG (legacy overlap) | Audit user actions | P1 | 4 | backend | `apps/api/app/main.py`, `docs/ops/monitoring-log-checklist.md` | in_progress |
| FR-37 | legacy-system-config | System configuration | P2 | 4 | backend | `TBD` | deferred |
| FR-38 | legacy-error-feedback | Error handling and user feedback | P1 | 3 | backend/web | `apps/api/app/main.py`, `apps/web/src/lib/api.ts` | in_progress |
| FR-39 | legacy-email-verification | Account verification (activation) | P0 | 1 | backend/web | `apps/api/app/auth/routes.py`, `apps/api/tests/test_auth.py` | done |
| FR-40 | legacy-lockout-session-policy | Session and account security policy | P0 | 1 | backend | `apps/api/app/auth/security.py`, `apps/api/tests/test_auth.py` | done |
| FR-41 | legacy-concurrency | Concurrent edit protection | P2 | 4 | backend | `TBD` | deferred |
| FR-42 | legacy-data-export-erasure | Personal data export and erasure | P2 | 4 | backend | `TBD` | deferred |
| FR-43 | legacy-bulk-actions | Bulk operations on requests | P2 | 4 | backend/web | `TBD` | deferred |
| FR-44 | legacy-integration-hooks | Integration hooks | P2 | 4 | backend | `TBD` | deferred |
| NFR-01 | legacy-perf-budget | Performance | P0 | 2 | backend/web/devops | `apps/api/tests/test_performance_smoke.py`, `docs/ops/performance-latency-baseline.md` | done |
| NFR-02 | NFR-OPS-HEALTH | Availability and reliability | P0 | 1 | backend | `apps/api/app/main.py` | done |
| NFR-03 | NFR-SEC-SCAN | Security | P0 | 3 | backend/devops | `docs/ops/security-verification-checklist.md`, `apps/api/tests/test_auth.py` | done |
| NFR-04 | legacy-privacy-baseline | Privacy and data protection | P2 | 4 | backend/devops | `TBD` | deferred |
| NFR-05 | legacy-a11y | Usability and accessibility | P1 | 4 | web | `TBD` | not_started |
| NFR-06 | NFR-SEC-CI | Maintainability and supportability | P0 | 1 | devops/backend | `.github/workflows/ci.yml`, `apps/api/app/main.py` | done |
| NFR-07 | legacy-scale | Scalability | P2 | 4 | backend/devops | `TBD` | deferred |
| NFR-08 | NFR-TRACE-LOG | Observability and monitoring | P1 | 4 | devops/backend | `docs/ops/monitoring-log-checklist.md`, `docs/ops/release-rehearsal-checklist.md` | in_progress |
| NFR-09 | NFR-OPS-BACKUP, NFR-OPS-INCIDENT | Backup and disaster recovery | P0 | 3 | devops | `docs/ops/backup-restore-runbook.md`, `docs/ops/incident-runbook.md` | done |
| NFR-10 | legacy-env-parity | Compatibility and portability | P0 | 4 | devops | `README.md`, `docker/docker-compose.yml`, `scripts/docker-up.ps1` | in_progress |
| NFR-11 | legacy-release-evidence | Audit and compliance | P0 | 4 | devops | `docs/release/p0-signoff.md`, `docs/release/p0-scope-checklist.md` | done |
| AFR-01 | legacy-ai-data-foundation | Training data ingestion | P2 | 4 | ai/backend | `TBD` | deferred |
| AFR-02 | legacy-ai-labeling | Label management and ground truth | P2 | 4 | ai/backend | `TBD` | deferred |
| AFR-03 | legacy-ai-data-quality | Dataset quality gates | P2 | 4 | ai/backend | `TBD` | deferred |
| AFR-04 | legacy-ai-preprocessing | Feature and preprocessing pipeline | P2 | 4 | ai/backend | `TBD` | deferred |
| AFR-05 | legacy-ai-training | Train and fine-tune models | P2 | 4 | ai/backend | `TBD` | deferred |
| AFR-06 | legacy-ai-experiments | Experiment tracking | P2 | 4 | ai/backend | `TBD` | deferred |
| AFR-07 | legacy-ai-promotion-gate | Evaluation and promotion gate | P2 | 4 | ai/backend | `TBD` | deferred |
| AFR-08 | legacy-ai-registry | Model registry and versioning | P2 | 4 | ai/backend | `TBD` | deferred |
| AFR-09 | FR-XAI (legacy partial overlap) | Model serving API | P1 | 4 | backend/ai | `packages/ai-engine/src/ai_engine/match.py`, `apps/api/app/candidate/routes.py` | in_progress |
| AFR-10 | legacy-ai-rollout | Controlled rollout and rollback | P2 | 4 | ai/devops | `TBD` | deferred |
| AFR-11 | NFR-FAIRNESS (legacy partial overlap) | Drift and performance monitoring | P2 | 4 | ai/devops | `TBD` | deferred |
| AFR-12 | FR-XAI (legacy partial overlap) | Explainability and human override | P1 | 4 | backend/web/ai | `TBD` | not_started |

## Update Process

1. Add every new `FR-*`, `NFR-*`, and `AFR-*` row before implementation starts.
2. Keep `Priority` and `Planned Week` aligned with the release plan and backlog.
3. Use `Legacy Crosswalk` only to preserve historical references from prior docs/PRs.
4. Do not mark `done` without concrete evidence path(s).
5. For deferred items, add reason in PR/release notes and update backlog docs.
