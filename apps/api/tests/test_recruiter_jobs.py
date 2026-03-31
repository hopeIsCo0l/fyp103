"""Recruiter job APIs under /api/recruiter/jobs."""

from fastapi.testclient import TestClient


def _headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_candidate_blocked_from_recruiter_jobs(client: TestClient, make_verified_user):
    u = make_verified_user("cand@t.com", "Passw0rd!1", role="candidate")
    r = client.get("/api/recruiter/jobs", headers=_headers(u["access_token"]))
    assert r.status_code == 403


def test_recruiter_crud_job(client: TestClient, make_verified_user):
    u = make_verified_user("rec@t.com", "Passw0rd!1", role="recruiter")
    h = _headers(u["access_token"])

    r = client.post(
        "/api/recruiter/jobs",
        headers=h,
        json={
            "title": "Backend Engineer",
            "description": "Build APIs",
            "company_name": "Acme",
            "location": "Remote",
            "employment_type": "full_time",
            "status": "open",
        },
    )
    assert r.status_code == 201
    job_id = r.json()["id"]
    assert r.json()["title"] == "Backend Engineer"
    assert r.json()["applicants_count"] == 0

    r = client.get("/api/recruiter/jobs", headers=h)
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 1
    assert data["items"][0]["id"] == job_id

    r = client.get(f"/api/recruiter/jobs/{job_id}", headers=h)
    assert r.status_code == 200
    assert r.json()["status"] == "open"

    r = client.patch(
        f"/api/recruiter/jobs/{job_id}",
        headers=h,
        json={"status": "paused"},
    )
    assert r.status_code == 200
    assert r.json()["status"] == "paused"

    r = client.delete(f"/api/recruiter/jobs/{job_id}", headers=h)
    assert r.status_code == 204

    r = client.get(f"/api/recruiter/jobs/{job_id}", headers=h)
    assert r.status_code == 404


def test_recruiter_cannot_see_other_recruiters_job(client: TestClient, make_verified_user):
    r1 = make_verified_user("r1@t.com", "Passw0rd!1", role="recruiter")
    r2 = make_verified_user("r2@t.com", "Passw0rd!1", role="recruiter")

    created = client.post(
        "/api/recruiter/jobs",
        headers=_headers(r1["access_token"]),
        json={"title": "Secret role", "description": "x", "status": "open"},
    )
    job_id = created.json()["id"]

    resp = client.get(f"/api/recruiter/jobs/{job_id}", headers=_headers(r2["access_token"]))
    assert resp.status_code == 404

    lst = client.get("/api/recruiter/jobs", headers=_headers(r2["access_token"]))
    assert lst.json()["total"] == 0


def test_admin_can_access_any_job(client: TestClient, make_verified_user):
    rec = make_verified_user("rec2@t.com", "Passw0rd!1", role="recruiter")
    adm = make_verified_user("adm@t.com", "Passw0rd!1", role="admin")

    created = client.post(
        "/api/recruiter/jobs",
        headers=_headers(rec["access_token"]),
        json={"title": "Shared", "description": "d", "status": "open"},
    )
    job_id = created.json()["id"]

    r = client.get(f"/api/recruiter/jobs/{job_id}", headers=_headers(adm["access_token"]))
    assert r.status_code == 200
    assert r.json()["title"] == "Shared"

    r = client.get("/api/recruiter/jobs", headers=_headers(adm["access_token"]))
    assert r.status_code == 200
    assert r.json()["total"] >= 1


def test_list_jobs_filter_by_status(client: TestClient, make_verified_user):
    u = make_verified_user("rec3@t.com", "Passw0rd!1", role="recruiter")
    h = _headers(u["access_token"])
    client.post(
        "/api/recruiter/jobs",
        headers=h,
        json={"title": "Open job", "description": "a", "status": "open"},
    )
    client.post(
        "/api/recruiter/jobs",
        headers=h,
        json={"title": "Draft job", "description": "b", "status": "draft"},
    )
    r = client.get("/api/recruiter/jobs?status=open", headers=h)
    assert r.status_code == 200
    assert r.json()["total"] == 1
    assert r.json()["items"][0]["status"] == "open"
