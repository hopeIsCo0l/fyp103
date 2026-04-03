"""Run inference with persisted CV-job model.

Input schemas:
- Jobs JSON: list[{"id","title","description"}]
- CVs JSON: list[{"id","name","text"}]
- Jobs CSV:  id,title,description
- CVs CSV:   id,name,text

Outputs:
- pair_scores.csv
- top_matches.csv
"""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path

from ai_engine.cv_job_model import JobRecord, load_bundle, rank_jobs_for_cv


def _read_jobs_json(path: Path) -> list[JobRecord]:
    raw = json.loads(path.read_text(encoding="utf-8"))
    out: list[JobRecord] = []
    for idx, row in enumerate(raw):
        out.append(
            JobRecord(
                id=str(row.get("id", f"job_{idx+1}")),
                title=str(row["title"]),
                description=str(row["description"]),
            )
        )
    return out


def _read_jobs_csv(path: Path) -> list[JobRecord]:
    out: list[JobRecord] = []
    with path.open("r", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for idx, row in enumerate(reader):
            out.append(
                JobRecord(
                    id=str(row.get("id", f"job_{idx+1}")),
                    title=str(row["title"]),
                    description=str(row["description"]),
                )
            )
    return out


def _read_cvs_json(path: Path) -> list[dict[str, str]]:
    raw = json.loads(path.read_text(encoding="utf-8"))
    out: list[dict[str, str]] = []
    for idx, row in enumerate(raw):
        out.append(
            {
                "id": str(row.get("id", f"cv_{idx+1}")),
                "name": str(row.get("name", f"CV {idx+1}")),
                "text": str(row["text"]),
            }
        )
    return out


def _read_cvs_csv(path: Path) -> list[dict[str, str]]:
    out: list[dict[str, str]] = []
    with path.open("r", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for idx, row in enumerate(reader):
            out.append(
                {
                    "id": str(row.get("id", f"cv_{idx+1}")),
                    "name": str(row.get("name", f"CV {idx+1}")),
                    "text": str(row["text"]),
                }
            )
    return out


def _write_csv(path: Path, rows: list[dict[str, str | float]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Inference using persisted CV-job model")
    parser.add_argument("--model-path", type=Path, required=True, help="Path to .pkl model artifact")
    parser.add_argument("--jobs-json", type=Path, default=None, help="Jobs input JSON")
    parser.add_argument("--jobs-csv", type=Path, default=None, help="Jobs input CSV")
    parser.add_argument("--cvs-json", type=Path, default=None, help="CVs input JSON")
    parser.add_argument("--cvs-csv", type=Path, default=None, help="CVs input CSV")
    parser.add_argument("--out-dir", type=Path, default=Path("sample_data/out"), help="Output directory")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if bool(args.jobs_json) == bool(args.jobs_csv):
        raise SystemExit("Provide exactly one jobs input: --jobs-json OR --jobs-csv")
    if bool(args.cvs_json) == bool(args.cvs_csv):
        raise SystemExit("Provide exactly one CV input: --cvs-json OR --cvs-csv")

    jobs = _read_jobs_json(args.jobs_json) if args.jobs_json else _read_jobs_csv(args.jobs_csv)
    cvs = _read_cvs_json(args.cvs_json) if args.cvs_json else _read_cvs_csv(args.cvs_csv)
    bundle = load_bundle(args.model_path)

    pair_rows: list[dict[str, str | float]] = []
    top_rows: list[dict[str, str | float]] = []

    for cv in cvs:
        ranked = rank_jobs_for_cv(bundle, cv_text=cv["text"], jobs=jobs)
        for row in ranked:
            pair_rows.append(
                {
                    "cv_id": cv["id"],
                    "cv_name": cv["name"],
                    "job_id": row["job_id"],
                    "job_title": row["job_title"],
                    "predicted_fit": row["predicted_fit"],
                    "ranking_score": round(float(row["ranking_score"]), 6),
                    "prob_good": round(float(row["prob_good"]), 6),
                    "prob_medium": round(float(row["prob_medium"]), 6),
                    "prob_bad": round(float(row["prob_bad"]), 6),
                    "lexical_similarity": round(float(row["lexical_similarity"]), 6),
                }
            )
        top = ranked[0]
        top_rows.append(
            {
                "cv_id": cv["id"],
                "cv_name": cv["name"],
                "job_id": top["job_id"],
                "job_title": top["job_title"],
                "predicted_fit": top["predicted_fit"],
                "ranking_score": round(float(top["ranking_score"]), 6),
                "prob_good": round(float(top["prob_good"]), 6),
                "prob_medium": round(float(top["prob_medium"]), 6),
                "prob_bad": round(float(top["prob_bad"]), 6),
                "lexical_similarity": round(float(top["lexical_similarity"]), 6),
            }
        )

    pair_path = args.out_dir / "pair_scores.csv"
    top_path = args.out_dir / "top_matches.csv"
    fields = [
        "cv_id",
        "cv_name",
        "job_id",
        "job_title",
        "predicted_fit",
        "ranking_score",
        "prob_good",
        "prob_medium",
        "prob_bad",
        "lexical_similarity",
    ]
    _write_csv(pair_path, pair_rows, fields)
    _write_csv(top_path, top_rows, fields)
    print(f"Saved: {pair_path}")
    print(f"Saved: {top_path}")
    print(f"Processed CVs: {len(cvs)} | Jobs: {len(jobs)}")


if __name__ == "__main__":
    main()
