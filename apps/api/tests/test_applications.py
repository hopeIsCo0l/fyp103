"""Job applications (Week 3): apply, list, recruiter pipeline."""

from fastapi.testclient import TestClient


def _headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def _assert_score_breakdown_consistent(
    payload: dict,
    *,
    cv_weight: float,
    exam_weight: float,
    interview_weight: float,
) -> None:
    assert payload["weighted_total_score"] is not None
    breakdown = payload["score_breakdown"]
    assert breakdown["cv_weight"] == cv_weight
    assert breakdown["exam_weight"] == exam_weight
    assert breakdown["interview_weight"] == interview_weight
    assert breakdown["cv_score"] == (payload["cv_similarity_score"] or 0.0)
    assert breakdown["exam_score"] == 0.0
    assert breakdown["interview_score"] == 0.0
    assert breakdown["weighted_total_score"] == payload["weighted_total_score"]


def test_apply_with_cv_text_sets_similarity(client: TestClient, make_verified_user):
    rec = make_verified_user("cvrec@t.com", "Passw0rd!1", role="recruiter")
    cand = make_verified_user("cvcand@t.com", "Passw0rd!2", role="candidate")
    h_rec = _headers(rec["access_token"])
    r = client.post(
        "/api/recruiter/jobs",
        json={
            "title": "Python Developer",
            "description": "We need Python and FastAPI experience.",
            "status": "open",
            "criteria_weights": {"cv": 0.6, "exam": 0.2, "interview": 0.2},
        },
        headers=h_rec,
    )
    assert r.status_code == 201
    job_id = r.json()["id"]
    h_c = _headers(cand["access_token"])
    cv = "Senior Python developer with FastAPI and SQLAlchemy experience."
    r = client.post(
        f"/api/jobs/{job_id}/apply",
        headers=h_c,
        json={"cv_text": cv},
    )
    assert r.status_code == 201
    body = r.json()
    assert body["job_id"] == job_id
    assert body["cv_similarity_score"] is not None
    assert 0.0 <= body["cv_similarity_score"] <= 1.0
    _assert_score_breakdown_consistent(body, cv_weight=0.6, exam_weight=0.2, interview_weight=0.2)
    assert body["weighted_total_score"] == body["cv_similarity_score"] * 0.6

    listed = client.get("/api/candidate/applications", headers=h_c).json()
    assert len(listed) == 1
    assert listed[0]["cv_similarity_score"] == body["cv_similarity_score"]
    assert listed[0]["weighted_total_score"] == body["weighted_total_score"]
    _assert_score_breakdown_consistent(listed[0], cv_weight=0.6, exam_weight=0.2, interview_weight=0.2)
    assert listed[0]["score_breakdown"] == body["score_breakdown"]

    rec_list = client.get(f"/api/recruiter/jobs/{job_id}/applications", headers=h_rec).json()
    assert len(rec_list) == 1
    assert rec_list[0]["cv_similarity_score"] == body["cv_similarity_score"]
    assert rec_list[0]["weighted_total_score"] == body["weighted_total_score"]
    _assert_score_breakdown_consistent(rec_list[0], cv_weight=0.6, exam_weight=0.2, interview_weight=0.2)
    assert rec_list[0]["score_breakdown"] == body["score_breakdown"]

    all_recruiter = client.get("/api/recruiter/applications", headers=h_rec).json()
    assert len(all_recruiter) == 1
    assert all_recruiter[0]["weighted_total_score"] == body["weighted_total_score"]
    assert all_recruiter[0]["score_breakdown"] == body["score_breakdown"]

    app_id = rec_list[0]["id"]
    updated = client.patch(
        f"/api/recruiter/applications/{app_id}",
        json={"stage": "screening"},
        headers=h_rec,
    )
    assert updated.status_code == 200
    updated_body = updated.json()
    assert updated_body["stage"] == "screening"
    assert updated_body["weighted_total_score"] == body["weighted_total_score"]
    assert updated_body["score_breakdown"] == body["score_breakdown"]


def test_candidate_apply_and_list(client: TestClient, make_verified_user):
    rec = make_verified_user("apprec@t.com", "Passw0rd!1", role="recruiter")
    cand = make_verified_user("appcand@t.com", "Passw0rd!2", role="candidate")
    h_rec = _headers(rec["access_token"])
    r = client.post(
        "/api/recruiter/jobs",
        json={"title": "Backend Dev", "status": "open"},
        headers=h_rec,
    )
    assert r.status_code == 201
    job_id = r.json()["id"]

    h_c = _headers(cand["access_token"])
    r = client.post(f"/api/jobs/{job_id}/apply", headers=h_c)
    assert r.status_code == 201
    body = r.json()
    assert body["job_id"] == job_id
    assert body["stage"] == "applied"
    _assert_score_breakdown_consistent(body, cv_weight=0.4, exam_weight=0.35, interview_weight=0.25)
    assert body["cv_similarity_score"] is None
    assert body["weighted_total_score"] == 0.0

    r = client.get("/api/candidate/applications", headers=h_c)
    assert r.status_code == 200
    items = r.json()
    assert len(items) == 1
    assert items[0]["job_title"] == "Backend Dev"
    assert items[0]["weighted_total_score"] == body["weighted_total_score"]
    assert items[0]["score_breakdown"] == body["score_breakdown"]

    r = client.get(f"/api/recruiter/jobs/{job_id}/applications", headers=h_rec)
    assert r.status_code == 200
    assert len(r.json()) == 1
    assert r.json()[0]["candidate_email"] == "appcand@t.com"
    assert r.json()[0]["weighted_total_score"] == body["weighted_total_score"]
    assert r.json()[0]["score_breakdown"] == body["score_breakdown"]

    r = client.get("/api/recruiter/jobs", headers=h_rec)
    assert r.json()["items"][0]["applicants_count"] == 1


def test_apply_duplicate_returns_409(client: TestClient, make_verified_user):
    rec = make_verified_user("duprec@t.com", "Passw0rd!1", role="recruiter")
    cand = make_verified_user("dupcand@t.com", "Passw0rd!2", role="candidate")
    job_id = client.post(
        "/api/recruiter/jobs",
        json={"title": "X", "status": "open"},
        headers=_headers(rec["access_token"]),
    ).json()["id"]
    h_c = _headers(cand["access_token"])
    assert client.post(f"/api/jobs/{job_id}/apply", headers=h_c).status_code == 201
    r = client.post(f"/api/jobs/{job_id}/apply", headers=h_c)
    assert r.status_code == 409


def test_apply_closed_job_404(client: TestClient, make_verified_user):
    rec = make_verified_user("clsrec@t.com", "Passw0rd!1", role="recruiter")
    cand = make_verified_user("clscand@t.com", "Passw0rd!2", role="candidate")
    job_id = client.post(
        "/api/recruiter/jobs",
        json={"title": "Draft", "status": "draft"},
        headers=_headers(rec["access_token"]),
    ).json()["id"]
    r = client.post(f"/api/jobs/{job_id}/apply", headers=_headers(cand["access_token"]))
    assert r.status_code == 404


def test_recruiter_updates_stage(client: TestClient, make_verified_user):
    rec = make_verified_user("stgrec@t.com", "Passw0rd!1", role="recruiter")
    cand = make_verified_user("stgcand@t.com", "Passw0rd!2", role="candidate")
    job_id = client.post(
        "/api/recruiter/jobs",
        json={"title": "Role", "status": "open"},
        headers=_headers(rec["access_token"]),
    ).json()["id"]
    client.post(f"/api/jobs/{job_id}/apply", headers=_headers(cand["access_token"]))
    app_id = client.get(f"/api/recruiter/jobs/{job_id}/applications", headers=_headers(rec["access_token"])).json()[
        0
    ]["id"]
    r = client.patch(
        f"/api/recruiter/applications/{app_id}",
        json={"stage": "interview"},
        headers=_headers(rec["access_token"]),
    )
    assert r.status_code == 200
    assert r.json()["stage"] == "interview"


def test_recruiter_cannot_access_other_job_applicants(client: TestClient, make_verified_user):
    r1 = make_verified_user("o1@t.com", "Passw0rd!1", role="recruiter")
    r2 = make_verified_user("o2@t.com", "Passw0rd!2", role="recruiter")
    job_id = client.post(
        "/api/recruiter/jobs",
        json={"title": "Private", "status": "open"},
        headers=_headers(r1["access_token"]),
    ).json()["id"]
    r = client.get(f"/api/recruiter/jobs/{job_id}/applications", headers=_headers(r2["access_token"]))
    assert r.status_code == 404
