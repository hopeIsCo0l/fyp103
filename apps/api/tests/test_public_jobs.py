"""Public open job listing under /api/jobs."""

from fastapi.testclient import TestClient


def _auth(h: dict) -> dict[str, str]:
    return {"Authorization": f"Bearer {h['access_token']}"}


def test_public_lists_only_open_jobs(client: TestClient, make_verified_user):
    rec = make_verified_user("pubrec@t.com", "Passw0rd!1", role="recruiter")
    h = _auth(rec)

    client.post(
        "/api/recruiter/jobs",
        headers=h,
        json={"title": "Open role", "description": "d1", "status": "open"},
    )
    client.post(
        "/api/recruiter/jobs",
        headers=h,
        json={"title": "Draft role", "description": "d2", "status": "draft"},
    )

    r = client.get("/api/jobs")
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 1
    assert data["items"][0]["title"] == "Open role"
    assert "created_by" not in data["items"][0]


def test_public_detail_only_open(client: TestClient, make_verified_user):
    rec = make_verified_user("pubrec2@t.com", "Passw0rd!1", role="recruiter")
    h = _auth(rec)
    created = client.post(
        "/api/recruiter/jobs",
        headers=h,
        json={"title": "Hidden", "description": "x", "status": "draft"},
    )
    job_id = created.json()["id"]

    r = client.get(f"/api/jobs/{job_id}")
    assert r.status_code == 404


def test_public_detail_open_ok(client: TestClient, make_verified_user):
    rec = make_verified_user("pubrec3@t.com", "Passw0rd!1", role="recruiter")
    h = _auth(rec)
    created = client.post(
        "/api/recruiter/jobs",
        headers=h,
        json={"title": "Visible", "description": "body", "company_name": "Co", "status": "open"},
    )
    job_id = created.json()["id"]

    r = client.get(f"/api/jobs/{job_id}")
    assert r.status_code == 200
    assert r.json()["title"] == "Visible"
    assert r.json()["company_name"] == "Co"


def test_public_search_filters(client: TestClient, make_verified_user):
    rec = make_verified_user("pubrec4@t.com", "Passw0rd!1", role="recruiter")
    h = _auth(rec)
    client.post(
        "/api/recruiter/jobs",
        headers=h,
        json={"title": "Rust Engineer", "description": "systems", "status": "open"},
    )
    client.post(
        "/api/recruiter/jobs",
        headers=h,
        json={"title": "Python Dev", "description": "django", "status": "open"},
    )

    r = client.get("/api/jobs?search=python")
    assert r.status_code == 200
    assert r.json()["total"] == 1
    assert "Python" in r.json()["items"][0]["title"]


def test_public_pagination(client: TestClient, make_verified_user):
    rec = make_verified_user("pubrec5@t.com", "Passw0rd!1", role="recruiter")
    h = _auth(rec)
    for i in range(3):
        client.post(
            "/api/recruiter/jobs",
            headers=h,
            json={"title": f"Job {i}", "description": "d", "status": "open"},
        )

    r = client.get("/api/jobs?page=1&size=2")
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 3
    assert len(data["items"]) == 2
    assert data["page"] == 1
    assert data["size"] == 2
