# Monitoring and Log Review Checklist

## Runtime Signal Checks

- [x] API process healthy.
- [x] `/health` response is `200`.
- [x] `/ready` response is `200` and DB connectivity validated.
- [x] Postgres container/service healthy.

## Log Quality Checks

- [x] Request logs include method/path/status/duration.
- [x] `X-Request-ID` is present in responses for correlation.
- [x] Error logs include stack traces for unexpected exceptions.
- [x] No sensitive values (passwords/tokens/secrets) appear in logs.

## Functional Monitoring Checks

- [x] Auth endpoints within expected success/error range.
- [x] Candidate apply endpoint error rate monitored.
- [x] Recruiter job/application endpoints operational.

## Escalation Triggers

- [x] Sustained API 5xx above threshold.
- [x] Readiness failures for more than 5 minutes.
- [x] Login/apply path availability below agreed SLO.

## Evidence Record

| Date | Reviewer | Environment | Result | Notes |
|---|---|---|---|---|
| YYYY-MM-DD | @owner | local/staging/prod | pass/fail | |
| 2026-04-01 | Abdel | local | pass | `/health`=200, `/ready`=200, `X-Request-ID` present, auth/apply/recruiter flows exercised via `pytest` suites |
