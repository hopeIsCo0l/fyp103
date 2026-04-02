# Performance Latency Baseline (NFR-01)

This document captures the repeatable latency smoke evidence for non-reporting API requests.

## Scope

- Endpoints:
  - `GET /health`
  - `GET /ready`
- Thresholds (from `docs/recruitment-backlog.md`, NFR-01):
  - `p95 <= 800ms`
  - `p99 <= 1500ms`

## Automated Evidence

- Test file: `apps/api/tests/test_performance_smoke.py`
- Test name: `test_non_reporting_api_latency_budget`
- Method:
  - 40 total requests per endpoint
  - 5 warmup requests excluded
  - percentiles computed from remaining 35 samples
  - each response must return HTTP 200

## Run

From repo root:

```powershell
python -m pytest apps/api/tests/test_performance_smoke.py -q
```

## Notes

- This is a latency smoke baseline for core API probes; it is not a full load/stress benchmark.
- For comparability, run with Docker/PostgreSQL stack up and minimal background load.
