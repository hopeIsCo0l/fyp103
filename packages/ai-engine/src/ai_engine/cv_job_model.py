"""Production-style TF-IDF CV-job model utilities.

Supports:
- Training from labeled pair records
- Model persistence (pickle)
- Inference for one pair or CV vs many jobs
"""

from __future__ import annotations

import pickle
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.model_selection import GridSearchCV, StratifiedKFold, train_test_split
from sklearn.pipeline import FeatureUnion, Pipeline
from sklearn.preprocessing import LabelEncoder

SEED = 42
LABELS = ("bad", "medium", "good")


@dataclass(frozen=True)
class LabeledPairRecord:
    cv_text: str
    job_title: str
    job_description: str
    label: str


@dataclass(frozen=True)
class JobRecord:
    id: str
    title: str
    description: str


@dataclass(frozen=True)
class TrainedModelBundle:
    model: GridSearchCV
    encoder: LabelEncoder
    metadata: dict[str, Any]


def normalize_text(text: str) -> str:
    t = (text or "").lower().strip()
    t = re.sub(r"\s+", " ", t)
    return t


def pair_text(cv_text: str, job_title: str, job_description: str) -> str:
    return (
        f"cv_text: {normalize_text(cv_text)} "
        f"job_title: {normalize_text(job_title)} "
        f"job_description: {normalize_text(job_description)}"
    )


def _safe_n_splits(y_train: list[int]) -> int:
    counts: dict[int, int] = {}
    for value in y_train:
        counts[value] = counts.get(value, 0) + 1
    min_count = min(counts.values())
    return max(2, min(4, min_count))


def train_bundle(records: list[LabeledPairRecord]) -> tuple[TrainedModelBundle, dict[str, float]]:
    if len(records) < 12:
        raise ValueError("Need at least 12 labeled records to train a useful model")

    X = [pair_text(r.cv_text, r.job_title, r.job_description) for r in records]
    y = [normalize_text(r.label) for r in records]

    encoder = LabelEncoder()
    y_enc = encoder.fit_transform(y)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_enc, test_size=0.25, random_state=SEED, stratify=y_enc
    )

    features = FeatureUnion(
        [
            (
                "word_tfidf",
                TfidfVectorizer(
                    analyzer="word",
                    ngram_range=(1, 2),
                    sublinear_tf=True,
                    strip_accents="unicode",
                    lowercase=True,
                    max_features=14000,
                ),
            ),
            (
                "char_tfidf",
                TfidfVectorizer(
                    analyzer="char_wb",
                    ngram_range=(3, 5),
                    sublinear_tf=True,
                    lowercase=True,
                    max_features=22000,
                ),
            ),
        ]
    )
    classifier = LogisticRegression(
        class_weight="balanced",
        max_iter=4000,
        random_state=SEED,
    )
    pipeline = Pipeline([("features", features), ("clf", classifier)])
    cv_splits = _safe_n_splits(y_train.tolist())
    search = GridSearchCV(
        estimator=pipeline,
        param_grid={
            "clf__C": [0.5, 1.0, 2.0, 3.0],
            "features__word_tfidf__ngram_range": [(1, 1), (1, 2)],
            "features__char_tfidf__ngram_range": [(3, 5), (3, 6)],
        },
        cv=StratifiedKFold(n_splits=cv_splits, shuffle=True, random_state=SEED),
        scoring="f1_macro",
        n_jobs=-1,
        verbose=0,
    )
    search.fit(X_train, y_train)

    y_pred = search.predict(X_test)
    metrics = {
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "macro_f1": float(f1_score(y_test, y_pred, average="macro")),
        "best_cv_macro_f1": float(search.best_score_),
    }
    bundle = TrainedModelBundle(
        model=search,
        encoder=encoder,
        metadata={
            "seed": SEED,
            "num_records": len(records),
            "labels": list(encoder.classes_),
            "best_params": search.best_params_,
        },
    )
    return bundle, metrics


def save_bundle(bundle: TrainedModelBundle, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("wb") as f:
        pickle.dump(bundle, f)


def load_bundle(model_path: Path) -> TrainedModelBundle:
    with model_path.open("rb") as f:
        obj = pickle.load(f)
    if not isinstance(obj, TrainedModelBundle):
        raise TypeError("Unexpected model artifact type; expected TrainedModelBundle")
    return obj


def score_pair(bundle: TrainedModelBundle, cv_text: str, job_title: str, job_description: str) -> dict[str, float | str]:
    text = pair_text(cv_text, job_title, job_description)
    probs = bundle.model.predict_proba([text])[0]
    labels = list(bundle.encoder.classes_)
    prob_map = {label: float(probs[idx]) for idx, label in enumerate(labels)}
    predicted = str(labels[int(probs.argmax())])

    vec = TfidfVectorizer(ngram_range=(1, 2), stop_words="english", sublinear_tf=True)
    tf = vec.fit_transform([cv_text, f"{job_title} {job_description}"])
    lexical = float(cosine_similarity(tf[0:1], tf[1:2])[0, 0])
    ranking_score = 0.75 * (0.7 * prob_map.get("good", 0.0) + 0.3 * prob_map.get("medium", 0.0)) + 0.25 * lexical
    return {
        "predicted_fit": predicted,
        "ranking_score": float(max(0.0, min(1.0, ranking_score))),
        "prob_bad": prob_map.get("bad", 0.0),
        "prob_medium": prob_map.get("medium", 0.0),
        "prob_good": prob_map.get("good", 0.0),
        "lexical_similarity": lexical,
    }


def rank_jobs_for_cv(bundle: TrainedModelBundle, cv_text: str, jobs: list[JobRecord]) -> list[dict[str, float | str]]:
    rows: list[dict[str, float | str]] = []
    for job in jobs:
        score = score_pair(bundle, cv_text=cv_text, job_title=job.title, job_description=job.description)
        rows.append(
            {
                "job_id": job.id,
                "job_title": job.title,
                **score,
            }
        )
    rows.sort(key=lambda row: float(row["ranking_score"]), reverse=True)
    return rows
