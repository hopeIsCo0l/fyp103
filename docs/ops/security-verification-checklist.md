# Security Verification Checklist (P0)

Date: 2026-04-01  
Environment: local (Docker Postgres + host API/web)

## Baseline Controls

- [x] JWT auth and role guards exercised (`apps/api/tests/test_auth.py`).
- [x] Rate limiting and lockout behavior verified in auth test suite.
- [x] Request correlation header (`X-Request-ID`) verified on live `/health`.

## Dependency Vulnerability Review

- [x] Frontend audit: `cd apps/web && npm audit --omit=dev --audit-level=high` -> **0 vulnerabilities**.
- [x] Backend audit: `apps/api/venv311/Scripts/pip-audit.exe -r apps/api/requirements.txt` executed.
  - Finding: 8 known vulns across `python-jose`, `python-multipart`, `starlette`.
  - Fix candidates: `python-jose>=3.4.0`, `python-multipart>=0.0.22`, `starlette>=0.47.2`.
  - Constraint note: direct `starlette` upgrade requires coordinated `fastapi` compatibility testing.

## Secrets Hygiene Review

- [x] Pattern scan for common key formats (`AKIA`, `ghp_`, private keys, Google API keys) -> no matches in tracked source/docs.
- [x] Hardcoded password regex scan reviewed; hits were test-only literals in `apps/api/tests/test_auth.py`.

## Risk Decision (Release Exception)

- [x] Exception recorded for unresolved backend dependency CVEs pending coordinated framework upgrade.
- [x] Follow-up backlog item added in `docs/release/p1-p2-backlog.md` with owner and target window.

## Signoff

| Role | Name | Date | Decision |
|---|---|---|---|
| Engineering lead | Abdel | 2026-04-01 | approve with exception |
| QA/test owner | Abdel | 2026-04-01 | approve with exception |
| Ops/release owner | Abdel | 2026-04-01 | approve with exception |
