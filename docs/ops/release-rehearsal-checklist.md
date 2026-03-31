# Release Rehearsal and Rollback Checklist

Use this checklist before production cut.

## Pre-Deployment

- [ ] Branch and commit hash frozen for release candidate.
- [ ] CI pipeline green (backend + frontend).
- [ ] Alembic migrations reviewed for forward/backward safety.
- [ ] Backup taken and verified (`docs/ops/backup-restore-runbook.md`).
- [ ] Runbooks reviewed by incident lead.

## Deployment Rehearsal (staging-like)

- [ ] Deploy images/stack using release candidate artifacts.
- [ ] Run migration step (`alembic upgrade head`).
- [ ] Validate API:
  - [ ] `/health` returns 200.
  - [ ] `/ready` returns 200.
  - [ ] Auth smoke test.
  - [ ] Recruiter job CRUD smoke test.
  - [ ] Candidate apply smoke test.
- [ ] Validate frontend:
  - [ ] Auth/login pages load.
  - [ ] Candidate jobs/applications page loads.
  - [ ] Recruiter jobs/applicants page loads.

## Rollback Rehearsal

- [ ] Confirm last known-good image/tag.
- [ ] Revert app deployment to previous version.
- [ ] Validate API and frontend smoke checks on rolled-back version.
- [ ] Restore DB from backup in a non-production environment and validate integrity.

## Signoff

| Role | Name | Date | Decision |
|---|---|---|---|
| Engineering lead | | | approve/reject |
| QA/test owner | | | approve/reject |
| Ops/release owner | | | approve/reject |
