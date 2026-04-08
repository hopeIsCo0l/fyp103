# External CV–job scorer (sanity checks)

Use this when the **CV similarity API** runs in Docker (e.g. `ea-cv-job-matcher` / `cv-similarity-api`) on **port 8000**, and you want to verify connectivity before wiring `EA_CV_SCORER_URL` in the recruitment backend.

## Host sanity check (backend on the **host**, scorer on Docker `:8000`)

**Base URL:** `http://127.0.0.1:8000`

| Step | Expected |
|------|----------|
| **GET** `/ready` | **200** — `status` and `scorer_source` (e.g. `baseline_tfidf_cosine_v1`) |
| **POST** `/v1/score` with `req.json` | **200** — ranked results, `latency_ms` |

`req.json` lives at the **repository root** (same sample as below: two Ethiopian Airlines jobs + `top_k`).

### Quick checks (PowerShell)

```powershell
curl.exe -s http://127.0.0.1:8000/ready
```

For **POST** on Windows, prefer a JSON file or Python so quotes are not mangled:

```powershell
curl.exe -s -X POST http://127.0.0.1:8000/v1/score -H "Content-Type: application/json" --data-binary "@req.json"
```

(Run from the repo root, or use `@C:\path\to\req.json`.)

## If the backend runs **inside Docker**

Use the base URL the **container** will use to reach the scorer on the host:

**`http://host.docker.internal:8000`**

Do **not** use `http://127.0.0.1:8000` from inside the backend container — that refers to the container itself, not the host machine.

Repeat the checks from the host (Docker Desktop on Windows resolves `host.docker.internal`):

```powershell
curl.exe -s http://host.docker.internal:8000/ready
curl.exe -s -X POST http://host.docker.internal:8000/v1/score -H "Content-Type: application/json" --data-binary "@req.json"
```

If the scorer is added as a **Compose service in the same compose file** as the backend, prefer the **service name** as hostname (e.g. `http://cv-similarity-api:8000`) instead of `host.docker.internal`.

## Configuration in this repo

- **`EA_CV_SCORER_URL`** in `apps/api/.env` (see `apps/api/.env.example`) is the intended **base URL only** (no `/v1/score` path) for a future HTTP client that calls `{base}/ready` and `{base}/v1/score`. Until that wiring exists, the app ignores this variable and scoring stays **in-process** (see `packages/ai-engine` and `apps/api/app/jobs/ai_scoring.py`).

## Scorer container notes

`SERVING_BACKEND=local` and `ROLLOUT_MODE=production` are **inside the scoring image** only; they control which model/registry the scorer uses. The recruitment platform does not need to mirror those unless you orchestrate multiple scorer deployments.
