# Sample Data for Batch CV-Job Matching

This folder contains ready-to-run sample files:

- `jobs/` : 3 Ethiopian Airlines-style job descriptions
- `cvs/`  : 10 CV text files (5 good, 2 medium, 3 bad examples)

Run from repository root with one command:

```powershell
python packages/ai-engine/src/ai_engine/tfidf_cv_job_batch.py
```

Outputs are written to:

- `sample_data/out/pair_scores.csv`
- `sample_data/out/top_matches.csv`

## Production-style train/infer flow

Train and persist a model artifact (default output path shown):

```powershell
python packages/ai-engine/src/ai_engine/train_cv_job_model.py
```

Run inference from persisted model:

```powershell
python packages/ai-engine/src/ai_engine/infer_cv_job_model.py `
  --model-path sample_data/models/cv_job_model.pkl `
  --jobs-json sample_data/jobs.json `
  --cvs-json sample_data/cvs.json `
  --out-dir sample_data/out
```

### JSON schema

- jobs JSON row: `{ "id": "job_1", "title": "...", "description": "..." }`
- cvs JSON row: `{ "id": "cv_1", "name": "...", "text": "..." }`
- training JSON row: `{ "cv_text": "...", "job_title": "...", "job_description": "...", "label": "good|medium|bad" }`

CSV versions use the same field names as column headers.
