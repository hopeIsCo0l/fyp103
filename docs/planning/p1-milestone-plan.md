# P1 Milestone Plan (Next Delivery Slice)

Branch: `feat/p1-milestone-delivery`  
Base: `feat/cv-tfidf-match`  
Date: 2026-04-01

## Goal

Deliver all P1 backlog items with implementation evidence (API/UI/tests/docs), while closing the recorded P0 security exception.

## Scope (P1)

1. Security dependency remediation:
   - Upgrade and validate `python-jose`, `python-multipart`, and framework-compatible `fastapi`/`starlette`.
   - Re-run backend vulnerability scan and record clean output.
2. Exam workflow:
   - Recruiter exam authoring.
   - Candidate exam submission.
   - Score persistence and retrieval in application lifecycle.
3. Interview scoring integration:
   - Add recruiter interview score input/update.
   - Include interview score in weighted composite behavior and output.
4. Recruiter score sorting/filtering:
   - Add weighted-score sorting/filtering in recruiter candidate/application views.
5. Readiness SLO alerting:
   - Define readiness failure thresholds and alert runbook integration.

## Exit Criteria

- [ ] All P1 scope items implemented and merged.
- [ ] Backend + frontend quality gates pass in CI.
- [ ] Targeted tests for each P1 item pass locally and in CI.
- [ ] `pip-audit` shows no unresolved high/critical findings for API deps.
- [ ] Traceability matrix and backlog updated with final status/evidence links.

## Tracking Notes

- Keep PRs small and feature-scoped.
- Link each implementation PR back to this plan.
- For any spillover, move explicitly to P2 with owner/date rationale.
