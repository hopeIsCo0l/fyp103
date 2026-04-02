"""Admin API: password reset and self-service guards."""

from fastapi.testclient import TestClient

from app.database import SessionLocal
from app.models.user import User
from app.models.user_session import UserSession

ADMIN_EMAIL = "admin@test-recruit.com"
ADMIN_PASS = "AdminPass1!"
TARGET_EMAIL = "target@test-recruit.com"
TARGET_PASS = "TargetPass1!"


def _make_admin_and_target(client, captured_otps) -> tuple[str, str]:
    """Return (admin_access_token, target_user_id)."""
    client.post(
        "/api/auth/signup",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASS, "full_name": "Admin"},
    )
    otp_a = captured_otps[ADMIN_EMAIL.lower()][-1]
    r = client.post("/api/auth/verify-email", json={"email": ADMIN_EMAIL, "otp": otp_a})
    assert r.status_code == 200
    admin_token = r.json()["access_token"]

    session = SessionLocal()
    u = session.query(User).filter(User.email == ADMIN_EMAIL.lower()).first()
    assert u
    u.role = "admin"
    u.is_super_admin = False
    session.commit()
    session.close()

    client.post(
        "/api/auth/signup",
        json={"email": TARGET_EMAIL, "password": TARGET_PASS, "full_name": "Target"},
    )
    otp_t = captured_otps[TARGET_EMAIL.lower()][-1]
    r2 = client.post("/api/auth/verify-email", json={"email": TARGET_EMAIL, "otp": otp_t})
    assert r2.status_code == 200
    target_id = r2.json()["user"]["id"]

    session = SessionLocal()
    cnt = session.query(UserSession).filter(UserSession.user_id == target_id, UserSession.revoked.is_(False)).count()
    session.close()
    assert cnt >= 1

    return admin_token, target_id


def test_admin_reset_password_returns_plain_and_revokes_sessions(client: TestClient, captured_otps):
    admin_token, target_id = _make_admin_and_target(client, captured_otps)
    h = {"Authorization": f"Bearer {admin_token}"}
    resp = client.post(f"/api/admin/users/{target_id}/reset-password", headers=h)
    assert resp.status_code == 200
    data = resp.json()
    assert "temporary_password" in data
    assert len(data["temporary_password"]) >= 16
    assert data["email"] == TARGET_EMAIL.lower()

    # Old password no longer works
    bad = client.post(
        "/api/auth/signin",
        json={"email": TARGET_EMAIL, "password": TARGET_PASS},
    )
    assert bad.status_code == 401

    good = client.post(
        "/api/auth/signin",
        json={"email": TARGET_EMAIL, "password": data["temporary_password"]},
    )
    assert good.status_code == 200

    session = SessionLocal()
    tu = session.query(User).filter(User.id == target_id).first()
    assert tu is not None
    assert tu.must_change_password is True
    session.close()

    temp_token = good.json()["access_token"]
    h_target = {"Authorization": f"Bearer {temp_token}"}
    blocked = client.get("/api/candidate/applications", headers=h_target)
    assert blocked.status_code == 403
    assert "password" in blocked.json()["detail"].lower()

    changed = client.post(
        "/api/auth/change-password",
        headers=h_target,
        json={
            "current_password": data["temporary_password"],
            "new_password": "UserChosenPass99!",
        },
    )
    assert changed.status_code == 200
    assert "access_token" in changed.json()

    session = SessionLocal()
    tu2 = session.query(User).filter(User.id == target_id).first()
    assert tu2 is not None
    assert tu2.must_change_password is False
    session.close()

    new_tok = changed.json()["access_token"]
    h2 = {"Authorization": f"Bearer {new_tok}"}
    ok = client.get("/api/candidate/applications", headers=h2)
    assert ok.status_code == 200

    session = SessionLocal()
    open_sess = (
        session.query(UserSession)
        .filter(UserSession.user_id == target_id, UserSession.revoked.is_(False))
        .count()
    )
    session.close()
    assert open_sess == 1


def test_export_users_csv_requires_super_admin(client: TestClient, captured_otps):
    admin_token, _ = _make_admin_and_target(client, captured_otps)
    h = {"Authorization": f"Bearer {admin_token}"}
    resp = client.get("/api/admin/users/export", headers=h)
    assert resp.status_code == 403
    assert "super" in resp.json()["detail"].lower()


def test_export_users_csv_super_admin_ok(client: TestClient, captured_otps):
    admin_token, _ = _make_admin_and_target(client, captured_otps)
    session = SessionLocal()
    u = session.query(User).filter(User.email == ADMIN_EMAIL.lower()).first()
    assert u
    u.is_super_admin = True
    session.commit()
    session.close()
    h = {"Authorization": f"Bearer {admin_token}"}
    resp = client.get("/api/admin/users/export", headers=h)
    assert resp.status_code == 200
    assert "text/csv" in resp.headers.get("content-type", "")


def test_admin_cannot_reset_own_password(client: TestClient, captured_otps):
    admin_token, _ = _make_admin_and_target(client, captured_otps)
    session = SessionLocal()
    admin_user = session.query(User).filter(User.email == ADMIN_EMAIL.lower()).first()
    admin_id = admin_user.id
    session.close()

    h = {"Authorization": f"Bearer {admin_token}"}
    resp = client.post(f"/api/admin/users/{admin_id}/reset-password", headers=h)
    assert resp.status_code == 400
    assert "own" in resp.json()["detail"].lower()
