# Security Dependency Remediation Plan (P1)

Date: 2026-04-01  
Owner: backend  
Branch: `feat/p1-milestone-delivery`

## Context

`pip-audit` previously reported backend dependency CVEs in:

- `python-jose==3.3.0`
- `python-multipart==0.0.9`
- `starlette==0.36.3` (via `fastapi==0.109.2`)

P0 accepted this as a documented release exception. This plan closes that exception.

## Targets

1. Upgrade `python-jose` to a non-vulnerable version (`>=3.4.0`).
2. Upgrade `python-multipart` to a non-vulnerable version (`>=0.0.22`).
3. Upgrade `fastapi` to a version that is compatible with secure `starlette` (targeting `starlette>=0.47.2`).
4. Keep API behavior unchanged for auth, jobs, applications, and admin endpoints.

## Execution Phases

### Phase 1 - Direct dependency uplift

- Update `apps/api/requirements.txt`:
  - `python-jose[cryptography]`
  - `python-multipart`
- Install and run:
  - `python -m ruff check app tests`
  - `python -m pytest -q`
  - `python -m pip_audit -r requirements.txt`

Exit gate:
- No regressions in auth/application tests.
- Vulnerabilities for `python-jose` and `python-multipart` cleared.

### Phase 2 - Framework compatibility uplift

- Upgrade `fastapi` and resolve transitive `starlette` version to secure range.
- Re-run full backend regression suite.
- Smoke-check critical API paths:
  - signup/signin/otp
  - recruiter job CRUD
  - candidate apply/list
  - readiness endpoint

Exit gate:
- Backend test suite passes.
- No API contract regressions.
- `pip-audit` returns no unresolved high/critical findings for backend requirements.

### Phase 3 - Evidence and closure

- Update:
  - `docs/ops/security-verification-checklist.md`
  - `docs/release/p1-p2-backlog.md`
  - `docs/planning/requirements-traceability.md` (if status transitions)
- Attach remediation evidence to PR:
  - before/after dependency list
  - `pip-audit` output
  - test command outputs

Exit gate:
- Security exception marked closed with evidence links.

## Risk Controls

- Use a dedicated PR only for dependency remediation to isolate risk.
- Prefer incremental upgrades (Phase 1 then Phase 2).
- If framework upgrade introduces regressions, rollback to last green commit and split by sub-step.

## Done Definition

- [ ] Secure versions in `apps/api/requirements.txt` merged.
- [ ] CI green for backend + frontend.
- [ ] `pip-audit` clean for high/critical findings.
- [ ] Security exception closed in release docs with dated evidence.
