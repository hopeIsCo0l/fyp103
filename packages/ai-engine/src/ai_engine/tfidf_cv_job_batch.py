"""Batch CV-job matcher with CSV export.

Usage:
  python tfidf_cv_job_batch.py --jobs-dir ./jobs --cvs-dir ./cvs --out-dir ./out

Input conventions:
- Jobs directory: one .txt file per job.
  - First line is treated as job title.
  - Remaining lines are job description.
- CVs directory: one .txt file per CV (full CV text).

Outputs:
- pair_scores.csv       : every CV-job pair with probabilities and score.
- top_matches.csv       : best job per CV.
"""

from __future__ import annotations

import argparse
import csv
import re
from dataclasses import dataclass
from pathlib import Path

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from ai_engine.cv_job_model import load_bundle, score_pair as persisted_score_pair
from ai_engine.tfidf_cv_job_poc import (
    DEFAULT_CVS,
    DEFAULT_JOBS,
    Job,
    build_pair_dataset,
    generate_balanced_job_training,
    generate_synthetic_training_examples,
    train_classifier,
)

SEED = 42


@dataclass(frozen=True)
class InputCV:
    id: str
    name: str
    text: str


def _normalize_text(text: str) -> str:
    text = (text or "").lower().strip()
    text = re.sub(r"\s+", " ", text)
    return text


def _combine_pair_text(cv_text: str, job: Job) -> str:
    return (
        f"cv_text: {_normalize_text(cv_text)} "
        f"job_title: {_normalize_text(job.title)} "
        f"job_description: {_normalize_text(job.description)}"
    )


def _safe_read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return path.read_text(encoding="cp1252", errors="replace")


def load_jobs_from_dir(jobs_dir: Path) -> list[Job]:
    files = sorted(jobs_dir.glob("*.txt"))
    jobs: list[Job] = []
    for f in files:
        raw = _safe_read_text(f).strip()
        if not raw:
            continue
        lines = [ln.strip() for ln in raw.splitlines() if ln.strip()]
        if not lines:
            continue
        title = lines[0]
        description = " ".join(lines[1:]) if len(lines) > 1 else lines[0]
        jobs.append(Job(id=f.stem, title=title, description=description))
    return jobs


def load_cvs_from_dir(cvs_dir: Path) -> list[InputCV]:
    files = sorted(cvs_dir.glob("*.txt"))
    cvs: list[InputCV] = []
    for f in files:
        raw = _safe_read_text(f).strip()
        if not raw:
            continue
        cvs.append(InputCV(id=f.stem, name=f.stem.replace("_", " ").title(), text=raw))
    return cvs


def train_reference_model() -> tuple[object, object]:
    """Train model from built-in Ethiopian Airlines POC data."""
    X, y = build_pair_dataset(DEFAULT_JOBS, DEFAULT_CVS)
    syn_X, syn_y = generate_synthetic_training_examples(DEFAULT_JOBS, DEFAULT_CVS, copies_per_pair=3)
    bal_X, bal_y = generate_balanced_job_training(DEFAULT_JOBS, copies_per_class_per_job=14)
    X.extend(syn_X)
    y.extend(syn_y)
    X.extend(bal_X)
    y.extend(bal_y)
    model, encoder = train_classifier(X, y)
    return model, encoder


def score_pair(model: object, encoder: object, cv_text: str, job: Job) -> tuple[str, float, float, float]:
    pair_text = _combine_pair_text(cv_text, job)
    probs = model.predict_proba([pair_text])[0]
    labels = list(encoder.classes_)
    prob_map = {label: float(probs[idx]) for idx, label in enumerate(labels)}
    fit_label = labels[int(probs.argmax())]

    # Blend class confidence with lexical similarity.
    sim_vec = TfidfVectorizer(ngram_range=(1, 2), stop_words="english", sublinear_tf=True)
    tf = sim_vec.fit_transform([cv_text, f"{job.title} {job.description}"])
    lexical = float(cosine_similarity(tf[0:1], tf[1:2])[0, 0])
    blended = 0.75 * (0.7 * prob_map.get("good", 0.0) + 0.3 * prob_map.get("medium", 0.0)) + 0.25 * lexical

    return fit_label, blended, prob_map.get("good", 0.0), prob_map.get("medium", 0.0)


def score_pair_from_bundle(bundle: object, cv_text: str, job: Job) -> tuple[str, float, float, float]:
    row = persisted_score_pair(
        bundle=bundle,
        cv_text=cv_text,
        job_title=job.title,
        job_description=job.description,
    )
    return (
        str(row["predicted_fit"]),
        float(row["ranking_score"]),
        float(row["prob_good"]),
        float(row["prob_medium"]),
    )


def export_results(
    model: object,
    encoder: object,
    jobs: list[Job],
    cvs: list[InputCV],
    out_dir: Path,
) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)

    pair_rows: list[dict[str, str | float]] = []
    top_rows: list[dict[str, str | float]] = []

    for cv in cvs:
        ranked: list[dict[str, str | float]] = []
        for job in jobs:
            fit_label, score, p_good, p_medium = score_pair(model, encoder, cv.text, job)
            row = {
                "cv_id": cv.id,
                "cv_name": cv.name,
                "job_id": job.id,
                "job_title": job.title,
                "predicted_fit": fit_label,
                "ranking_score": round(score, 6),
                "prob_good": round(p_good, 6),
                "prob_medium": round(p_medium, 6),
            }
            pair_rows.append(row)
            ranked.append(row)

        ranked.sort(key=lambda x: float(x["ranking_score"]), reverse=True)
        top_rows.append(ranked[0])

    pair_csv = out_dir / "pair_scores.csv"
    top_csv = out_dir / "top_matches.csv"

    with pair_csv.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "cv_id",
                "cv_name",
                "job_id",
                "job_title",
                "predicted_fit",
                "ranking_score",
                "prob_good",
                "prob_medium",
            ],
        )
        writer.writeheader()
        writer.writerows(pair_rows)

    with top_csv.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "cv_id",
                "cv_name",
                "job_id",
                "job_title",
                "predicted_fit",
                "ranking_score",
                "prob_good",
                "prob_medium",
            ],
        )
        writer.writeheader()
        writer.writerows(top_rows)

    print(f"\nExported: {pair_csv}")
    print(f"Exported: {top_csv}")
    print(f"Processed CVs: {len(cvs)} | Jobs: {len(jobs)} | Pairs: {len(pair_rows)}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Batch CV-job matcher with CSV export")
    parser.add_argument(
        "--jobs-dir",
        type=Path,
        default=Path("sample_data/jobs"),
        help="Folder containing job .txt files (default: sample_data/jobs)",
    )
    parser.add_argument(
        "--cvs-dir",
        type=Path,
        default=Path("sample_data/cvs"),
        help="Folder containing CV .txt files (default: sample_data/cvs)",
    )
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=Path("sample_data/out"),
        help="Output folder for CSV files (default: sample_data/out)",
    )
    parser.add_argument(
        "--model-path",
        type=Path,
        default=None,
        help="Optional persisted model artifact (.pkl). If omitted, trains reference model inline.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    jobs = load_jobs_from_dir(args.jobs_dir)
    cvs = load_cvs_from_dir(args.cvs_dir)

    if not jobs:
        raise SystemExit(f"No job files found in: {args.jobs_dir}")
    if not cvs:
        raise SystemExit(f"No CV files found in: {args.cvs_dir}")

    if args.model_path:
        bundle = load_bundle(args.model_path)
        out_dir = args.out_dir
        out_dir.mkdir(parents=True, exist_ok=True)

        pair_rows: list[dict[str, str | float]] = []
        top_rows: list[dict[str, str | float]] = []
        for cv in cvs:
            ranked: list[dict[str, str | float]] = []
            for job in jobs:
                fit_label, score, p_good, p_medium = score_pair_from_bundle(bundle, cv.text, job)
                row = {
                    "cv_id": cv.id,
                    "cv_name": cv.name,
                    "job_id": job.id,
                    "job_title": job.title,
                    "predicted_fit": fit_label,
                    "ranking_score": round(score, 6),
                    "prob_good": round(p_good, 6),
                    "prob_medium": round(p_medium, 6),
                }
                pair_rows.append(row)
                ranked.append(row)
            ranked.sort(key=lambda x: float(x["ranking_score"]), reverse=True)
            top_rows.append(ranked[0])

        pair_csv = out_dir / "pair_scores.csv"
        top_csv = out_dir / "top_matches.csv"
        with pair_csv.open("w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(
                f,
                fieldnames=[
                    "cv_id",
                    "cv_name",
                    "job_id",
                    "job_title",
                    "predicted_fit",
                    "ranking_score",
                    "prob_good",
                    "prob_medium",
                ],
            )
            writer.writeheader()
            writer.writerows(pair_rows)
        with top_csv.open("w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(
                f,
                fieldnames=[
                    "cv_id",
                    "cv_name",
                    "job_id",
                    "job_title",
                    "predicted_fit",
                    "ranking_score",
                    "prob_good",
                    "prob_medium",
                ],
            )
            writer.writeheader()
            writer.writerows(top_rows)

        print(f"\nExported: {pair_csv}")
        print(f"Exported: {top_csv}")
        print(f"Processed CVs: {len(cvs)} | Jobs: {len(jobs)} | Pairs: {len(pair_rows)}")
        return

    model, encoder = train_reference_model()
    export_results(model=model, encoder=encoder, jobs=jobs, cvs=cvs, out_dir=args.out_dir)


if __name__ == "__main__":
    main()
