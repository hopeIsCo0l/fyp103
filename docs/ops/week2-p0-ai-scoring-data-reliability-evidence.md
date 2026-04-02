# Week 2 Evidence Bundle - P0 AI/Scoring and Data Reliability

Date: 2026-04-01  
Branch: `feat/p1-milestone-delivery`

## Scope Covered

- Scoring determinism and API consistency
- Migration verification for clean and existing DB states
- Performance sanity checks for hot listing/scoring-read queries
- Ops signal readiness evidence linkage

## 1) Scoring Determinism Evidence

### Artifacts

- `packages/ai-engine/src/ai_engine/match.py`
- `apps/api/tests/test_scoring_breakdown.py`
- `apps/api/tests/test_applications.py`
- `docs/planning/weighted-scoring.md`

### Validation Run

```powershell
apps/api/venv311/Scripts/python.exe -m pytest apps/api/tests/test_scoring_breakdown.py -q
apps/api/venv311/Scripts/python.exe -m pytest apps/api/tests/test_applications.py -q
```

Results:

- `test_scoring_breakdown.py`: **4 passed**
- `test_applications.py`: **6 passed**

Determinism assertions covered:

- stable output for repeated identical inputs
- default-weight behavior with missing criteria
- null CV score behavior (`None -> 0.0`)
- API consistency of `weighted_total_score` and `score_breakdown` across apply/candidate/recruiter endpoints and stage updates

## 2) Migration Verification Evidence

### Artifacts

- `apps/api/tests/test_migrations.py`
- `docs/ops/migration-verification.md`

### Validation Run

```powershell
apps/api/venv311/Scripts/python.exe -m pytest apps/api/tests/test_migrations.py -q
```

Results:

- migration tests: **2 passed**
- scenarios verified:
  - clean bootstrap (`base -> head`)
  - existing DB transition (`003_add_job_applications -> head`)

Manual scenario evidence and command transcripts are documented in:

- `docs/ops/migration-verification.md`

## 3) Hot Query Performance Sanity (EXPLAIN ANALYZE)

Sanity checks were executed against a dedicated DB (`recruit_perf_sanity`) with synthetic data:

- 1 recruiter
- 150 candidates
- 80 jobs (40 open)
- 3000 applications

### Query A - candidate application listing join

- Plan highlights:
  - `Bitmap Index Scan` on `ix_job_applications_candidate_id`
  - hash join to jobs
- Execution time: **~1.00 ms**

### Query B - recruiter applications listing (`created_by` filter)

- Plan highlights:
  - `Index Scan` on `ix_jobs_created_by`
  - `Bitmap Index Scan` on `ix_job_applications_job_id`
  - `Index Only Scan` on `ix_users_id`
- Execution time: **~5.93 ms** (top 200 rows)

### Query C - open jobs listing with search filter

- Plan highlights:
  - sequential scan on `jobs` for `ILIKE` text filter
- Execution time: **~0.32 ms** (list) and **~0.73 ms** (count)

Interpretation:

- current hot paths are performant for sanity-scale volume.
- text search path uses sequential scan due wildcard `ILIKE`; if production volume grows, consider trigram indexing for title/description/company search.

## 4) Ops Signal Evidence Linkage

Supporting operational evidence is captured in:

- `docs/ops/monitoring-log-checklist.md`
- `docs/ops/release-rehearsal-checklist.md`
- `docs/ops/backup-restore-runbook.md`

These include recorded checks for:

- `/health` and `/ready` signal behavior
- request correlation header (`X-Request-ID`)
- backup/restore rehearsal
- release rehearsal signoff

## Exit Statement

Week-2 exit criterion met:

- deterministic scoring behavior is documented and test-covered
- migration reliability is verified for both clean and existing DB transitions
- hot query paths have baseline EXPLAIN ANALYZE evidence with no immediate red flags
