# Incident Response Runbook

## Severity Levels

- **SEV-1:** Full outage or major security incident.
- **SEV-2:** Core functionality degraded (auth, apply pipeline, recruiter ops).
- **SEV-3:** Non-critical issues with workaround.

## Immediate Response

1. Acknowledge incident and assign incident lead.
2. Capture timestamps, impacted endpoints, and latest deployment reference.
3. Check API health and readiness:
   - `GET /health`
   - `GET /ready`
4. Check recent logs for request failures and exception traces.

## Technical Triage

1. Verify Postgres health:
   - `docker compose -f docker/docker-compose.yml ps`
   - `pg_isready` from Postgres container.
2. Verify migration state:
   - `cd apps/api && python -m alembic current`
3. Confirm shared packages importability in API runtime:
   - `python -c "from ai_engine import cv_job_similarity; from recruit_database import CriteriaWeights; print('ok')"`

## Mitigation Paths

- **If caused by latest deploy:** execute rollback plan from release checklist.
- **If DB issue:** restore from latest known-good backup.
- **If external dependency issue:** disable non-critical dependency paths and keep core APIs available.

## Communication

- Update stakeholders every 30 minutes for SEV-1/SEV-2.
- Include impact, mitigation status, ETA, and next update time.

## Closure

1. Confirm system health and readiness stable.
2. Document root cause and preventive actions.
3. Create follow-up tasks and assign owners with due dates.

## Postmortem Template

| Field | Details |
|---|---|
| Incident ID | |
| Severity | |
| Start/End time | |
| User impact | |
| Root cause | |
| Detection gap | |
| Actions taken | |
| Preventive actions | |
