"""Unit tests for deterministic weighted score breakdown behavior."""

import pytest
from ai_engine.match import weighted_score_breakdown


def test_weighted_score_breakdown_uses_defaults_for_missing_weights():
    out = weighted_score_breakdown(cv_similarity_score=0.8, criteria_weights=None)
    assert out["cv_weight"] == 0.4
    assert out["exam_weight"] == 0.35
    assert out["interview_weight"] == 0.25
    assert out["cv_score"] == 0.8
    assert out["exam_score"] == 0.0
    assert out["interview_score"] == 0.0
    assert out["weighted_total_score"] == pytest.approx(0.32, abs=1e-12)


def test_weighted_score_breakdown_none_cv_score_is_deterministic_zero():
    out = weighted_score_breakdown(
        cv_similarity_score=None,
        criteria_weights={"cv": 0.6, "exam": 0.2, "interview": 0.2},
    )
    assert out["cv_score"] == 0.0
    assert out["weighted_total_score"] == 0.0


def test_weighted_score_breakdown_ignores_unknown_weight_keys():
    out = weighted_score_breakdown(
        cv_similarity_score=1.0,
        criteria_weights={"cv": 1.0, "exam": 0.0, "interview": 0.0, "unknown": 99.0},
    )
    assert out["cv_weight"] == 1.0
    assert out["exam_weight"] == 0.0
    assert out["interview_weight"] == 0.0
    assert out["weighted_total_score"] == 1.0


def test_weighted_score_breakdown_is_repeatable_for_same_inputs():
    criteria = {"cv": 0.6, "exam": 0.2, "interview": 0.2}
    first = weighted_score_breakdown(cv_similarity_score=0.3333333333, criteria_weights=criteria)
    second = weighted_score_breakdown(cv_similarity_score=0.3333333333, criteria_weights=criteria)
    assert first == second
