"""Job applications (Week 3): apply, list, recruiter pipeline."""

from fastapi.testclient import TestClient


def _headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


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

    r = client.get("/api/candidate/applications", headers=h_c)
    assert r.status_code == 200
    items = r.json()
    assert len(items) == 1
    assert items[0]["job_title"] == "Backend Dev"

    r = client.get(f"/api/recruiter/jobs/{job_id}/applications", headers=h_rec)
    assert r.status_code == 200
    assert len(r.json()) == 1
    assert r.json()[0]["candidate_email"] == "appcand@t.com"

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
