# P0 Scope Lock (Strict Production-Ready)

This checklist defines the non-negotiable P0 release bar.

## P0 Functional Scope

- [x] Authentication and role-based access control for candidate/recruiter/admin.
- [x] Recruiter job CRUD with criteria weights support.
- [x] Public open-job browse endpoints.
- [x] Candidate apply flow with duplicate/ownership guards.
- [x] Candidate and recruiter application views with stage progression.
- [x] CV similarity scoring (TF-IDF + cosine) captured on application.
- [ ] Weighted transparent scoring (criteria-aware composite) exposed in API responses.

## P0 Reliability and Operations

- [x] Alembic migrations are source-of-truth and run at startup/init.
- [x] CI quality gates for backend/frontend are enabled.
- [x] Health endpoint exists (`/health`).
- [ ] Readiness endpoint verifies DB connectivity (`/ready`).
- [ ] Backup and restore runbook completed and rehearsal evidence recorded.
- [ ] Release rehearsal checklist completed in staging-like environment.
- [ ] Rollback procedure documented and rehearsal evidence recorded.

## P0 Security Baseline

- [x] JWT auth and refresh/session behavior implemented.
- [x] Rate limiting on sensitive auth endpoints.
- [x] Account lockout policy.
- [ ] Security verification checklist completed before release cut.
- [ ] Dependency scan and secrets hygiene review attached to release evidence.

## P0 Observability

- [x] Request logs include method/path/status/duration.
- [x] Response includes request correlation header (`X-Request-ID`).
- [ ] Monitoring/log review checklist completed with signoff.

## Exit Gate

Release can proceed only when:
1. All P0 boxes are checked, or exceptions are explicitly waived.
2. Evidence links are recorded in release signoff.
3. Deferred items are moved to P1/P2 backlog with owner and due window.
