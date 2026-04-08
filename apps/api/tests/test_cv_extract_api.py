"""API tests for POST /api/candidate/cv/extract."""

from io import BytesIO


def test_extract_txt_requires_auth(client):
    r = client.post(
        "/api/candidate/cv/extract",
        files={"file": ("cv.txt", BytesIO(b"Hello from resume"), "text/plain")},
    )
    assert r.status_code == 401


def test_extract_txt_success(client, make_verified_user):
    u = make_verified_user("cand@example.com", "Secret123!")
    h = {"Authorization": f"Bearer {u['access_token']}"}
    r = client.post(
        "/api/candidate/cv/extract",
        files={"file": ("cv.txt", BytesIO(b"Experienced pilot with 2000 hours."), "text/plain")},
        headers=h,
    )
    assert r.status_code == 200
    data = r.json()
    assert data["file_format"] == "txt"
    assert "pilot" in data["cv_text"].lower()


def test_extract_rejects_bad_extension(client, make_verified_user):
    u = make_verified_user("cand2@example.com", "Secret123!")
    h = {"Authorization": f"Bearer {u['access_token']}"}
    r = client.post(
        "/api/candidate/cv/extract",
        files={"file": ("bad.exe", BytesIO(b"MZ"), "application/octet-stream")},
        headers=h,
    )
    assert r.status_code == 422
    assert r.json()["detail"]["code"] == "unsupported_type"
