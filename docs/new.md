You are my coding agent in a fresh repository. Build a standalone AI project for CV-to-job similarity focused on **Ethiopian Airlines jobs only**, with a hard cap of **8 jobs** per scoring run.

## Project Goal

Deliver a production-ready **baseline** AI service using **TF-IDF + cosine similarity** (no deep model training yet), with clear tests, evaluation artifacts, and an integration contract for another backend repo.

## Scope (Phase 1 Only)

1. TF-IDF similarity scoring between one CV and up to 8 Ethiopian Airlines job descriptions.
2. Synthetic dataset generation for evaluation.
3. Deterministic evaluation pipeline and report.
4. HTTP API service for scoring.
5. Dockerized run and clear docs.
6. Integration contract + fallback behavior for external backend.

Do NOT implement heavy model training/fine-tuning in this phase; document it as next phase.

---

## Technical Requirements

### Core Scoring

- Implement shared-corpus TF-IDF ranking:
  - Corpus per request = `[candidate_cv] + selected_jobs(<=8)`.
  - Use cosine similarity to score CV vs each job.
- Suggested vectorizer defaults:
  - `ngram_range=(1,2)`
  - `max_features=5000`
  - `stop_words='english'`
  - `sublinear_tf=True`
- Normalize text (lowercase, whitespace cleanup, safe punctuation handling).
- Return score in `[0.0, 1.0]`.

### Domain Restriction

- Only include jobs from Ethiopian Airlines scope.
- Enforce cap: max 8 jobs per request.
- Reject or clearly handle empty CV / empty jobs / invalid payloads.

### Labels

- Add baseline label mapping:
  - `good` if score >= 0.40
  - `medium` if 0.20 <= score < 0.40
  - `bad` if score < 0.20

### Explainability

- Return top matched terms/features per job (lightweight explanation).

---

## Repository Structure (create this)

- `src/`
  - `api/` (FastAPI app + routers)
  - `scoring/` (tfidf vectorizer, similarity, labeling, explainability)
  - `data/` (schema + loaders)
  - `evaluation/` (metrics + report generator)
  - `config/`
- `tests/`
  - unit tests for scoring
  - API tests
  - deterministic ranking tests
- `scripts/`
  - synthetic dataset generator
  - evaluation runner
- `artifacts/`
  - evaluation outputs (json/csv/markdown)
- `docs/`
  - architecture
  - API contract
  - integration guide
  - runbook
- `Dockerfile`
- `docker-compose.yml`
- `README.md`
- `pyproject.toml` (or requirements + tooling)

---

## API Contract (must implement)

### Endpoint: `POST /v1/score`

Request:

- `cv_text: string`
- `jobs: [{ job_id: string, title: string, description: string, company_name: string }]`
- optional `top_k: int` (default 8, max 8)

Behavior:

- Filter to Ethiopian Airlines jobs only.
- If >8 valid jobs, keep deterministic top 8 by stable rule (document rule).
- Score and rank descending.

Response:

- `request_id`
- `scorer_source` (e.g., `baseline_tfidf_cosine_v1`)
- `ranked_results: [{ rank, job_id, score, label, top_terms }]`
- `excluded_jobs` with reasons (e.g., non-ethiopian, missing-text)
- `latency_ms`

Error format:

- `{ "detail": "<user-friendly message>", "request_id": "<id>" }`

Health endpoints:

- `GET /health`
- `GET /ready`

---

## Synthetic Data + Evaluation

### Generate dataset

Create synthetic evaluation set with:

- CV examples (ground operations, cabin crew, pilot support, maintenance, finance/ops mix, etc.)
- Ethiopian Airlines job descriptions only
- Expected relevance labels or ranking hints

### Evaluation metrics

At minimum:

- Top-1 accuracy
- Top-3 hit rate
- Mean reciprocal rank (MRR)
- Threshold sanity table (`good/medium/bad`)

### Output artifacts

Produce:

- `artifacts/eval_results.json`
- `artifacts/eval_summary.md`
- Optional CSV for per-sample details

---

## Testing Requirements

Implement automated tests for:

1. Ethiopian-only filter enforced.
2. Max-8 cap enforced.
3. Deterministic ranking for fixed inputs.
4. Score range always `[0,1]`.
5. Empty/invalid input handling.
6. API response schema + error schema.

---

## Integration Notes (for external backend repo)

Create `docs/integration-guide.md` describing:

- Endpoint URL + auth placeholder
- Request/response examples
- Timeout/retry guidance
- Fallback rule for caller if AI unavailable:
  - return neutral score + `scorer_source=fallback_unavailable`
- Versioning strategy (`scorer_source` and API path version)

---

## Deliverables (Definition of Done)

You are done only when:

1. Service runs locally with one command.
2. Tests pass.
3. Evaluation scripts run and artifacts are generated.
4. API contract is documented and implemented.
5. README includes quickstart + sample curl.
6. A concise architecture summary is included in docs.

---

## Execution Style

- Work incrementally and show progress.
- Use clear commit-style checkpoints in your explanation.
- Prefer maintainable, readable code over complexity.
- Keep phase-1 strictly TF-IDF baseline; list phase-2 training roadmap in docs only.
