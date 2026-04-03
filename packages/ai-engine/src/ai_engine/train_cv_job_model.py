"""Train and persist CV-job TF-IDF model.

Accepted training schemas:
1) JSON: list[{"cv_text","job_title","job_description","label"}]
2) CSV : columns cv_text,job_title,job_description,label
"""

from __future__ import annotations

import argparse
import csv
import json
import random
from pathlib import Path

from ai_engine.cv_job_model import LabeledPairRecord, save_bundle, train_bundle
from ai_engine.tfidf_cv_job_poc import (
    DEFAULT_CVS,
    DEFAULT_JOBS,
    _augment_text,
    _infer_non_target_label,
    _job_skill_bank,
)


def _records_from_json(path: Path) -> list[LabeledPairRecord]:
    raw = json.loads(path.read_text(encoding="utf-8"))
    out: list[LabeledPairRecord] = []
    for row in raw:
        out.append(
            LabeledPairRecord(
                cv_text=str(row["cv_text"]),
                job_title=str(row["job_title"]),
                job_description=str(row["job_description"]),
                label=str(row["label"]).lower(),
            )
        )
    return out


def _records_from_csv(path: Path) -> list[LabeledPairRecord]:
    out: list[LabeledPairRecord] = []
    with path.open("r", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            out.append(
                LabeledPairRecord(
                    cv_text=str(row["cv_text"]),
                    job_title=str(row["job_title"]),
                    job_description=str(row["job_description"]),
                    label=str(row["label"]).lower(),
                )
            )
    return out


def _reference_records() -> list[LabeledPairRecord]:
    rng = random.Random(42)
    out: list[LabeledPairRecord] = []
    # Base labeled pairs from canonical samples.
    for cv in DEFAULT_CVS:
        for job in DEFAULT_JOBS:
            label = cv.fit_level if cv.target_job_id == job.id else _infer_non_target_label(cv.text, job)
            out.append(
                LabeledPairRecord(
                    cv_text=cv.text,
                    job_title=job.title,
                    job_description=job.description,
                    label=label,
                )
            )

    # Light augmentation from base CV text.
    for cv in DEFAULT_CVS:
        for job in DEFAULT_JOBS:
            label = cv.fit_level if cv.target_job_id == job.id else _infer_non_target_label(cv.text, job)
            for _ in range(3):
                out.append(
                    LabeledPairRecord(
                        cv_text=_augment_text(cv.text, rng),
                        job_title=job.title,
                        job_description=job.description,
                        label=label,
                    )
                )

    # Balanced synthetic curriculum per job and label.
    for job in DEFAULT_JOBS:
        bank = _job_skill_bank(job)
        for label in ("bad", "medium", "good"):
            skills = bank[label]
            for i in range(14):
                snippet = skills[i % len(skills)]
                out.append(
                    LabeledPairRecord(
                        cv_text=f"{snippet}. teamwork communication and problem solving.",
                        job_title=job.title,
                        job_description=job.description,
                        label=label,
                    )
                )
    return out


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train and persist CV-job TF-IDF model")
    parser.add_argument("--train-json", type=Path, default=None, help="Training data JSON file")
    parser.add_argument("--train-csv", type=Path, default=None, help="Training data CSV file")
    parser.add_argument(
        "--model-out",
        type=Path,
        default=Path("sample_data/models/cv_job_model.pkl"),
        help="Output model artifact path",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.train_json and args.train_csv:
        raise SystemExit("Use one training source: --train-json OR --train-csv (not both).")

    if args.train_json:
        records = _records_from_json(args.train_json)
        source = str(args.train_json)
    elif args.train_csv:
        records = _records_from_csv(args.train_csv)
        source = str(args.train_csv)
    else:
        records = _reference_records()
        source = "built-in Ethiopian Airlines reference data"

    bundle, metrics = train_bundle(records)
    save_bundle(bundle, args.model_out)
    print(f"Training source: {source}")
    print(f"Records: {len(records)}")
    print(f"Accuracy: {metrics['accuracy']:.3f}")
    print(f"Macro F1: {metrics['macro_f1']:.3f}")
    print(f"Best CV Macro F1: {metrics['best_cv_macro_f1']:.3f}")
    print(f"Saved model: {args.model_out}")


if __name__ == "__main__":
    main()
