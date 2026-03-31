# Monitoring and Log Review Checklist

## Runtime Signal Checks

- [ ] API process healthy.
- [ ] `/health` response is `200`.
- [ ] `/ready` response is `200` and DB connectivity validated.
- [ ] Postgres container/service healthy.

## Log Quality Checks

- [ ] Request logs include method/path/status/duration.
- [ ] `X-Request-ID` is present in responses for correlation.
- [ ] Error logs include stack traces for unexpected exceptions.
- [ ] No sensitive values (passwords/tokens/secrets) appear in logs.

## Functional Monitoring Checks

- [ ] Auth endpoints within expected success/error range.
- [ ] Candidate apply endpoint error rate monitored.
- [ ] Recruiter job/application endpoints operational.

## Escalation Triggers

- [ ] Sustained API 5xx above threshold.
- [ ] Readiness failures for more than 5 minutes.
- [ ] Login/apply path availability below agreed SLO.

## Evidence Record

| Date | Reviewer | Environment | Result | Notes |
|---|---|---|---|---|
| YYYY-MM-DD | @owner | local/staging/prod | pass/fail | |
