# Deferred Backlog (P1/P2)

This backlog captures non-P0 items with ownership and target windows.

## P1 (Next Priority)

| Item | Owner | Target Window | Reason Deferred | Success Criteria |
|---|---|---|---|---|
| Exam authoring + candidate submission workflow | backend + web | Week 3 | Requires data model and UI scope beyond current P0 | Recruiter can attach exam, candidate submits, score stored |
| Interview score input and weighting in composite score | backend + recruiter UI | Week 3 | Interview module not yet implemented | `interview_score` no longer placeholder |
| Recruiter filtering/sorting by weighted score | web | Week 3-4 | UX enhancement after core score API | Recruiter tables sort/filter by score |
| Readiness SLO alert automation | devops | Week 4 | Needs infra alerting integration | Alert trigger documented and tested |

## P2 (Later / Nice-to-Have)

| Item | Owner | Target Window | Reason Deferred | Success Criteria |
|---|---|---|---|---|
| XAI narrative explanation text (human-friendly) | ai/backend | Week 4+ | Depends on final scoring dimensions | API returns concise explanation text |
| Bias/fairness checks and audit reporting | ai/backend | Week 4+ | Needs policy and data governance decisions | Repeatable fairness report process |
| Dense embeddings with pgvector/hybrid retrieval | ai/backend | Week 4+ | Current phase uses TF-IDF baseline | Embedding similarity integrated and benchmarked |
| Async queue for heavy AI tasks | backend/devops | Week 4+ | Not required at current load | Queue path implemented with retries/monitoring |

## Review Cadence

- Revalidate this backlog weekly during release planning.
- Promote/defer items only with explicit owner and reason.
