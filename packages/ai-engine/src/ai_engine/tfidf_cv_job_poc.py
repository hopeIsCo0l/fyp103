"""POC: TF-IDF based CV vs Job Description classifier for Ethiopian Airlines use cases.

This script:
1) defines default Ethiopian Airlines-like jobs and CVs
2) generates labeled CV-job pair data (good / medium / bad fit)
3) optionally augments training data for better robustness
4) trains a tuned TF-IDF + linear classifier pipeline
5) evaluates and prints ranked job matches per CV

Simple interface:
- Replace DEFAULT_JOBS / DEFAULT_CVS lists below with your own data.
- Or pass --jobs-json and --cvs-json with arrays of objects.
"""

from __future__ import annotations

import argparse
import json
import random
import re
from dataclasses import dataclass
from pathlib import Path

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, f1_score
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.model_selection import GridSearchCV, StratifiedKFold, train_test_split
from sklearn.pipeline import FeatureUnion, Pipeline
from sklearn.preprocessing import LabelEncoder

SEED = 42
random.seed(SEED)

LABELS = ("bad", "medium", "good")


@dataclass(frozen=True)
class Job:
    id: str
    title: str
    description: str


@dataclass(frozen=True)
class CV:
    id: str
    name: str
    text: str
    target_job_id: str
    fit_level: str


def _normalize_text(text: str) -> str:
    text = (text or "").lower().strip()
    text = re.sub(r"\s+", " ", text)
    return text


# ---- SIMPLE INTERFACE: replace these lists with your own jobs/cvs ----
DEFAULT_JOBS: list[Job] = [
    Job(
        id="job_ops_01",
        title="Flight Operations Performance Analyst",
        description=(
            "Ethiopian Airlines seeks a Flight Operations Performance Analyst to monitor OTP "
            "(on-time performance), delay drivers, crew utilization, and route profitability. "
            "Requires strong SQL, Python, dashboarding (Power BI/Tableau), aviation KPI reporting, "
            "and stakeholder communication with dispatch, OCC, and network planning teams."
        ),
    ),
    Job(
        id="job_mx_01",
        title="Aircraft Maintenance Planning Engineer",
        description=(
            "Ethiopian Airlines maintenance division needs an Aircraft Maintenance Planning Engineer "
            "to plan A-check/C-check activities, analyze reliability trends, and coordinate parts "
            "availability. Requires EASA/ICAO awareness, AMOS or equivalent MRO system experience, "
            "Excel/SQL skills, and technical reporting for safety and compliance."
        ),
    ),
    Job(
        id="job_cargo_01",
        title="Cargo Operations Officer",
        description=(
            "Ethiopian Cargo invites applications for Cargo Operations Officer. Role handles export/import "
            "documentation, dangerous goods checks, ULD allocation, warehouse coordination, and shipment "
            "tracking. Requires IATA cargo process knowledge, customer service, and shift-based operations."
        ),
    ),
]

DEFAULT_CVS: list[CV] = [
    # 5 GOOD
    CV(
        id="cv_g_01",
        name="Mekdes Bekele",
        target_job_id="job_ops_01",
        fit_level="good",
        text=(
            "BSc in Statistics, 5 years airline operations analytics. Built delay prediction model using "
            "Python and SQL, reduced average departure delay by 12%. Developed OTP dashboard in Power BI "
            "for OCC and dispatch. Excellent communication with flight operations leadership."
        ),
    ),
    CV(
        id="cv_g_02",
        name="Samuel Tadesse",
        target_job_id="job_ops_01",
        fit_level="good",
        text=(
            "Data analyst with aviation domain background. Advanced SQL, pandas, and Tableau. Led route "
            "performance analysis and crew utilization optimization project. Experience presenting KPI packs "
            "to network planning and station managers."
        ),
    ),
    CV(
        id="cv_g_03",
        name="Hana Girma",
        target_job_id="job_mx_01",
        fit_level="good",
        text=(
            "Aircraft maintenance engineer with 7 years in planning and reliability. Coordinated A-check/C-check "
            "maintenance windows, managed AMOS work packages, and improved parts planning accuracy. Familiar with "
            "ICAO continuing airworthiness standards and compliance reporting."
        ),
    ),
    CV(
        id="cv_g_04",
        name="Bereket Alemu",
        target_job_id="job_cargo_01",
        fit_level="good",
        text=(
            "Cargo operations specialist, 6 years in import/export handling. Experience with airway bills, "
            "dangerous goods validation, ULD planning, and shipment tracking. Strong customer communication and "
            "warehouse shift coordination."
        ),
    ),
    CV(
        id="cv_g_05",
        name="Saron Kassaye",
        target_job_id="job_mx_01",
        fit_level="good",
        text=(
            "Maintenance planning engineer skilled in reliability trend analysis, technical documentation, and "
            "MRO planning systems. Worked with engineering teams on preventive maintenance schedules and safety "
            "audits. Strong Excel and SQL reporting abilities."
        ),
    ),
    # 2 MEDIUM
    CV(
        id="cv_m_01",
        name="Yonas Asfaw",
        target_job_id="job_ops_01",
        fit_level="medium",
        text=(
            "Business analyst with 3 years dashboard and KPI reporting experience in logistics. Intermediate SQL "
            "and Excel. Limited direct airline exposure but has worked on dispatch-like scheduling analytics."
        ),
    ),
    CV(
        id="cv_m_02",
        name="Rahel Desalegn",
        target_job_id="job_cargo_01",
        fit_level="medium",
        text=(
            "Warehouse and freight coordinator with customer service and shipment documentation skills. "
            "Understands basic cargo procedures and tracking tools, but no dangerous goods certification yet."
        ),
    ),
    # 3 BAD
    CV(
        id="cv_b_01",
        name="Lulit Mengesha",
        target_job_id="job_ops_01",
        fit_level="bad",
        text=(
            "Junior graphic designer, 2 years in branding, logo design, and social media campaign visuals. "
            "Skilled in Adobe Photoshop and Illustrator. No aviation operations or data analytics experience."
        ),
    ),
    CV(
        id="cv_b_02",
        name="Abel Fekadu",
        target_job_id="job_mx_01",
        fit_level="bad",
        text=(
            "Primary school teacher with classroom management and curriculum development experience. "
            "Strong communication and child mentoring skills. No technical maintenance or engineering background."
        ),
    ),
    CV(
        id="cv_b_03",
        name="Helen Wolde",
        target_job_id="job_cargo_01",
        fit_level="bad",
        text=(
            "Retail cashier with POS handling and inventory counting skills. Worked in supermarkets and "
            "customer-facing sales. No cargo documentation, logistics, or aviation process knowledge."
        ),
    ),
]


def _combine_pair_text(cv_text: str, job: Job) -> str:
    return (
        f"cv_text: {_normalize_text(cv_text)} "
        f"job_title: {_normalize_text(job.title)} "
        f"job_description: {_normalize_text(job.description)}"
    )


def _infer_non_target_label(cv_text: str, job: Job) -> str:
    """Rule-of-thumb labeling for non-target job pairs."""
    combined = _normalize_text(cv_text + " " + job.title + " " + job.description)
    soft_overlap_groups = [
        {"operations", "kpi", "otp", "dispatch"},
        {"maintenance", "reliability", "airworthiness", "amos"},
        {"cargo", "shipment", "warehouse", "dangerous goods"},
    ]
    overlap_hits = sum(1 for group in soft_overlap_groups if any(token in combined for token in group))
    return "medium" if overlap_hits >= 2 else "bad"


def build_pair_dataset(jobs: list[Job], cvs: list[CV]) -> tuple[list[str], list[str]]:
    X: list[str] = []
    y: list[str] = []
    for cv in cvs:
        for job in jobs:
            X.append(_combine_pair_text(cv.text, job))
            if cv.target_job_id == job.id:
                y.append(cv.fit_level)
            else:
                y.append(_infer_non_target_label(cv.text, job))
    return X, y


def _augment_text(base: str, rng: random.Random) -> str:
    """Small deterministic augmentation to improve generalization."""
    replacements = {
        "sql": ["structured query language", "sql querying"],
        "python": ["python programming", "python analytics"],
        "dashboard": ["kpi dashboard", "performance dashboard"],
        "maintenance": ["aircraft maintenance", "technical maintenance"],
        "cargo": ["air cargo", "freight operations"],
    }
    out = base
    for src, options in replacements.items():
        if src in out and rng.random() < 0.55:
            out = out.replace(src, rng.choice(options), 1)
    segments = [s.strip() for s in out.split(".") if s.strip()]
    if len(segments) > 2 and rng.random() < 0.40:
        rng.shuffle(segments)
        out = ". ".join(segments) + "."
    return out


def generate_synthetic_training_examples(
    jobs: list[Job], cvs: list[CV], copies_per_pair: int = 2
) -> tuple[list[str], list[str]]:
    """Generate additional weakly-augmented examples from base labeled pairs."""
    rng = random.Random(SEED)
    base_X, base_y = build_pair_dataset(jobs, cvs)
    syn_X: list[str] = []
    syn_y: list[str] = []
    for text, label in zip(base_X, base_y, strict=True):
        for _ in range(copies_per_pair):
            syn_X.append(_augment_text(text, rng))
            syn_y.append(label)
    return syn_X, syn_y


def _job_skill_bank(job: Job) -> dict[str, list[str]]:
    title = _normalize_text(job.title)
    if "operations" in title:
        return {
            "good": [
                "sql python otp delay analysis power bi aviation kpi reporting",
                "route profitability crew utilization dispatch collaboration dashboarding",
                "flight operations analytics tableau data modeling stakeholder reporting",
            ],
            "medium": [
                "excel reporting basic sql logistics kpi analysis and scheduling",
                "operations dashboarding communication with limited aviation exposure",
                "business intelligence metrics monitoring and presentation skills",
            ],
            "bad": [
                "graphic design branding illustrator social media campaigns",
                "school teaching lesson planning child mentoring classroom management",
                "retail cashier point of sale inventory counting customer sales",
            ],
        }
    if "maintenance" in title:
        return {
            "good": [
                "aircraft maintenance planning a-check c-check reliability amos easa icao",
                "airworthiness compliance technical reporting preventive maintenance planning",
                "mro work package optimization parts planning and engineering coordination",
            ],
            "medium": [
                "mechanical technician exposure with basic maintenance scheduling and excel",
                "engineering assistant with report writing and quality tracking",
                "operations background with limited aviation maintenance practice",
            ],
            "bad": [
                "marketing content creator copywriting and campaign management",
                "kindergarten teacher communication and curriculum support",
                "restaurant cashier customer service and billing support",
            ],
        }
    return {
        "good": [
            "cargo export import airway bill dangerous goods uld tracking warehouse",
            "iata cargo procedures shipment documentation and freight coordination",
            "customer cargo support shift operations and logistics monitoring",
        ],
        "medium": [
            "warehouse logistics coordinator with basic shipment documentation",
            "freight customer service and tracking without dg certification",
            "supply chain assistant with transport scheduling knowledge",
        ],
        "bad": [
            "mobile app developer android ui kotlin and firebase",
            "high school teacher exam preparation and student advising",
            "retail fashion sales and merchandising in mall stores",
        ],
    }


def generate_balanced_job_training(
    jobs: list[Job], copies_per_class_per_job: int = 14
) -> tuple[list[str], list[str]]:
    """Create balanced synthetic pairs per job for improved class separation."""
    rng = random.Random(SEED + 1)
    X: list[str] = []
    y: list[str] = []
    for job in jobs:
        bank = _job_skill_bank(job)
        for label in LABELS:
            skills = bank[label]
            for _ in range(copies_per_class_per_job):
                snippet = rng.choice(skills)
                cv_text = _augment_text(
                    f"{snippet}. teamwork communication problem solving in fast-paced environments.", rng
                )
                X.append(_combine_pair_text(cv_text, job))
                y.append(label)
    return X, y


def _safe_n_splits(y_train: list[int]) -> int:
    counts: dict[int, int] = {}
    for v in y_train:
        counts[v] = counts.get(v, 0) + 1
    min_count = min(counts.values())
    return max(2, min(4, min_count))


def train_classifier(X: list[str], y: list[str]) -> tuple[GridSearchCV, LabelEncoder]:
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
    clf = LogisticRegression(
        class_weight="balanced",
        max_iter=4000,
        random_state=SEED,
    )
    pipeline = Pipeline([("features", features), ("clf", clf)])

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
    print("\n=== Model Evaluation ===")
    print(f"Accuracy: {accuracy_score(y_test, y_pred):.3f}")
    print(f"Macro F1: {f1_score(y_test, y_pred, average='macro'):.3f}")
    print(classification_report(y_test, y_pred, target_names=encoder.classes_))
    print(f"Best Params: {search.best_params_}")
    print(f"Best CV F1-macro: {search.best_score_:.3f}")

    return search, encoder


def rank_jobs_for_cv(
    model: GridSearchCV, encoder: LabelEncoder, cv_obj: CV, jobs: list[Job]
) -> list[tuple[str, str, float]]:
    X = [_combine_pair_text(cv_obj.text, job) for job in jobs]
    probabilities = model.predict_proba(X)
    good_idx = int(encoder.transform(["good"])[0])
    medium_idx = int(encoder.transform(["medium"])[0])
    ml_scores = 0.7 * probabilities[:, good_idx] + 0.3 * probabilities[:, medium_idx]

    # Blend classifier confidence with direct lexical similarity for better ranking stability.
    jd_texts = [f"{job.title} {job.description}" for job in jobs]
    sim_vec = TfidfVectorizer(ngram_range=(1, 2), stop_words="english", sublinear_tf=True)
    tf = sim_vec.fit_transform([cv_obj.text, *jd_texts])
    lexical_scores = cosine_similarity(tf[0:1], tf[1:]).reshape(-1)
    scores = 0.75 * ml_scores + 0.25 * lexical_scores

    ranked: list[tuple[str, str, float]] = []
    for idx, job in enumerate(jobs):
        ranked.append((job.id, job.title, float(scores[idx])))
    ranked.sort(key=lambda x: x[2], reverse=True)
    return ranked


def _load_jobs_from_json(path: Path) -> list[Job]:
    raw = json.loads(path.read_text(encoding="utf-8"))
    out: list[Job] = []
    for idx, row in enumerate(raw):
        out.append(
            Job(
                id=str(row.get("id", f"job_{idx+1}")),
                title=str(row["title"]),
                description=str(row["description"]),
            )
        )
    return out


def _load_cvs_from_json(path: Path) -> list[CV]:
    raw = json.loads(path.read_text(encoding="utf-8"))
    out: list[CV] = []
    for idx, row in enumerate(raw):
        out.append(
            CV(
                id=str(row.get("id", f"cv_{idx+1}")),
                name=str(row["name"]),
                text=str(row["text"]),
                target_job_id=str(row.get("target_job_id", "")),
                fit_level=str(row.get("fit_level", "medium")).lower(),
            )
        )
    return out


def run_poc(jobs: list[Job], cvs: list[CV], use_synthetic_training: bool = True) -> None:
    print("\n=== Dataset Summary ===")
    print(f"Jobs: {len(jobs)} | CVs: {len(cvs)}")

    X, y = build_pair_dataset(jobs, cvs)
    if use_synthetic_training:
        syn_X, syn_y = generate_synthetic_training_examples(jobs, cvs, copies_per_pair=3)
        bal_X, bal_y = generate_balanced_job_training(jobs, copies_per_class_per_job=14)
        X.extend(syn_X)
        y.extend(syn_y)
        X.extend(bal_X)
        y.extend(bal_y)
        print(f"Training examples (with synthetic expansion): {len(X)}")
    else:
        print(f"Training examples (base only): {len(X)}")

    model, encoder = train_classifier(X, y)

    print("\n=== Job Ranking Per CV ===")
    for cv in cvs:
        ranked = rank_jobs_for_cv(model, encoder, cv, jobs)
        top_job = ranked[0]
        print(
            f"- {cv.name:<18} best match -> {top_job[1]} "
            f"(score={top_job[2]:.3f}, expected={cv.target_job_id}:{cv.fit_level})"
        )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="TF-IDF CV-job classifier POC")
    parser.add_argument(
        "--jobs-json",
        type=Path,
        default=None,
        help="Path to JSON array with jobs (id, title, description).",
    )
    parser.add_argument(
        "--cvs-json",
        type=Path,
        default=None,
        help="Path to JSON array with CVs (id, name, text, target_job_id, fit_level).",
    )
    parser.add_argument(
        "--no-synthetic",
        action="store_true",
        help="Disable synthetic data expansion.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    jobs = DEFAULT_JOBS if args.jobs_json is None else _load_jobs_from_json(args.jobs_json)
    cvs = DEFAULT_CVS if args.cvs_json is None else _load_cvs_from_json(args.cvs_json)
    run_poc(jobs=jobs, cvs=cvs, use_synthetic_training=not args.no_synthetic)


if __name__ == "__main__":
    main()
