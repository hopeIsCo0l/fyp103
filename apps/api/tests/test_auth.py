"""Integration tests for the full Week-1 auth surface."""

from fastapi.testclient import TestClient

EMAIL = "candidate@test.com"
PASSWORD = "SecurePass1!"

# ── helpers ──────────────────────────────────────────────────────────────


def _signup(client: TestClient, email=EMAIL, password=PASSWORD, role="candidate"):
    return client.post("/api/auth/signup", json={
        "email": email, "password": password, "full_name": "Test User", "role": role,
    })


def _verify(client: TestClient, email, otp):
    return client.post("/api/auth/verify-email", json={"email": email, "otp": otp})


def _signin(client: TestClient, email=EMAIL, password=PASSWORD):
    return client.post("/api/auth/signin", json={"email": email, "password": password})


# ── 1. Signup → Verify → Signin ─────────────────────────────────────────


class TestSignupVerifySignin:
    def test_signup_returns_200_and_sends_otp(self, client, captured_otps):
        resp = _signup(client)
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == EMAIL
        assert len(captured_otps[EMAIL]) == 1

    def test_duplicate_signup_before_verify_allowed(self, client, captured_otps):
        """Before OTP verification, re-signing up with the same email re-sends OTP."""
        _signup(client)
        resp = _signup(client)
        assert resp.status_code == 200
        assert len(captured_otps[EMAIL]) == 2

    def test_duplicate_signup_after_verify_rejected(self, client, captured_otps):
        _signup(client)
        otp = captured_otps[EMAIL][-1]
        _verify(client, EMAIL, otp)
        resp = _signup(client)
        assert resp.status_code == 400
        assert "already registered" in resp.json()["detail"].lower()

    def test_duplicate_phone_signup_after_verify_rejected(self, client, captured_otps):
        r1 = client.post(
            "/api/auth/signup",
            json={
                "email": "phone-a@test.com",
                "password": PASSWORD,
                "full_name": "User A",
                "phone": "+1555000111",
            },
        )
        assert r1.status_code == 200
        otp = captured_otps["phone-a@test.com"][-1]
        client.post("/api/auth/verify-email", json={"email": "phone-a@test.com", "otp": otp})
        r2 = client.post(
            "/api/auth/signup",
            json={
                "email": "phone-b@test.com",
                "password": PASSWORD,
                "full_name": "User B",
                "phone": "+1555000111",
            },
        )
        assert r2.status_code == 400
        assert "phone" in r2.json()["detail"].lower()

    def test_verify_email_with_correct_otp(self, client, captured_otps):
        _signup(client)
        otp = captured_otps[EMAIL][-1]
        resp = _verify(client, EMAIL, otp)
        assert resp.status_code == 200
        data = resp.json()
        assert data["user"]["is_email_verified"] is True
        assert "access_token" in data
        assert "refresh_token" in data

    def test_verify_email_with_wrong_otp(self, client, captured_otps):
        _signup(client)
        resp = _verify(client, EMAIL, "000000")
        assert resp.status_code == 400

    def test_signin_with_correct_password(self, client, make_verified_user):
        make_verified_user(EMAIL, PASSWORD)
        resp = _signin(client)
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data

    def test_signin_with_wrong_password(self, client, make_verified_user):
        make_verified_user(EMAIL, PASSWORD)
        resp = _signin(client, password="WrongPassword1!")
        assert resp.status_code == 401

    def test_me_returns_user(self, client, make_verified_user):
        tokens = make_verified_user(EMAIL, PASSWORD)
        resp = client.get("/api/auth/me", headers={
            "Authorization": f"Bearer {tokens['access_token']}"
        })
        assert resp.status_code == 200
        assert resp.json()["email"] == EMAIL
        assert resp.json()["profile_completed"] is False
        assert resp.json()["profile_completion_skipped"] is False

    def test_me_without_token_rejected(self, client):
        resp = client.get("/api/auth/me")
        assert resp.status_code == 401

    def test_update_me_updates_full_name_and_phone(self, client, make_verified_user):
        tokens = make_verified_user(EMAIL, PASSWORD)
        headers = {"Authorization": f"Bearer {tokens['access_token']}"}

        resp = client.patch(
            "/api/auth/me",
            json={"full_name": "  Updated User  ", "phone": " +1555000222 "},
            headers=headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["full_name"] == "Updated User"
        assert data["phone"] == "+1555000222"

        me = client.get("/api/auth/me", headers=headers)
        assert me.status_code == 200
        assert me.json()["full_name"] == "Updated User"
        assert me.json()["phone"] == "+1555000222"

    def test_update_me_updates_candidate_profile_and_bmi(self, client, make_verified_user):
        tokens = make_verified_user(EMAIL, PASSWORD)
        headers = {"Authorization": f"Bearer {tokens['access_token']}"}

        resp = client.patch(
            "/api/auth/me",
            json={
                "country": "Ethiopia",
                "city": "Addis Ababa",
                "subcity": "Bole",
                "birth_date": "2000-01-02",
                "education_level": "Bachelor",
                "high_school_name": "Bole Secondary School",
                "high_school_completion_year": 2018,
                "height_cm": 180,
                "weight_kg": 81,
                "skills_summary": "Python, FastAPI",
                "experience_summary": "Internship experience",
            },
            headers=headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["country"] == "Ethiopia"
        assert data["profile_completed"] is True
        assert data["profile_completion_skipped"] is False
        assert data["bmi"] == 25.0

    def test_update_me_can_skip_candidate_profile_completion(self, client, make_verified_user):
        tokens = make_verified_user(EMAIL, PASSWORD)
        headers = {"Authorization": f"Bearer {tokens['access_token']}"}

        resp = client.patch(
            "/api/auth/me",
            json={"profile_completion_skipped": True},
            headers=headers,
        )
        assert resp.status_code == 200
        assert resp.json()["profile_completion_skipped"] is True
        assert resp.json()["profile_completed"] is False

    def test_update_me_rejects_duplicate_phone(self, client, captured_otps, make_verified_user):
        phone = "+1555011111"
        owner_email = "phone-owner@test.com"
        signup = client.post(
            "/api/auth/signup",
            json={
                "email": owner_email,
                "password": PASSWORD,
                "full_name": "Phone Owner",
                "phone": phone,
            },
        )
        assert signup.status_code == 200
        owner_otp = captured_otps[owner_email][-1]
        verify = client.post(
            "/api/auth/verify-email", json={"email": owner_email, "otp": owner_otp}
        )
        assert verify.status_code == 200

        other = make_verified_user("other-user@test.com", PASSWORD)
        headers = {"Authorization": f"Bearer {other['access_token']}"}
        resp = client.patch("/api/auth/me", json={"phone": phone}, headers=headers)
        assert resp.status_code == 400
        assert "phone" in resp.json()["detail"].lower()


# ── 2. Refresh Token Rotation ────────────────────────────────────────────


class TestRefreshToken:
    def test_refresh_returns_new_tokens(self, client, make_verified_user):
        tokens = make_verified_user(EMAIL, PASSWORD)
        resp = client.post("/api/auth/refresh", json={
            "refresh_token": tokens["refresh_token"],
        })
        assert resp.status_code == 200
        new = resp.json()
        assert "access_token" in new
        assert "refresh_token" in new
        assert new["refresh_token"] != tokens["refresh_token"]

    def test_old_refresh_token_rejected_after_rotation(self, client, make_verified_user):
        tokens = make_verified_user(EMAIL, PASSWORD)
        old_rt = tokens["refresh_token"]
        client.post("/api/auth/refresh", json={"refresh_token": old_rt})
        resp = client.post("/api/auth/refresh", json={"refresh_token": old_rt})
        assert resp.status_code == 401

    def test_invalid_refresh_token_rejected(self, client):
        resp = client.post("/api/auth/refresh", json={"refresh_token": "garbage"})
        assert resp.status_code == 401


# ── 3. Forgot / Reset Password ──────────────────────────────────────────


class TestForgotResetPassword:
    def test_forgot_password_always_returns_generic_message(self, client, make_verified_user):
        make_verified_user(EMAIL, PASSWORD)
        resp = client.post("/api/auth/forgot-password", json={"email": EMAIL})
        assert resp.status_code == 200
        assert "account exists" in resp.json()["message"].lower()

    def test_forgot_password_unknown_email_same_response(self, client):
        resp = client.post("/api/auth/forgot-password", json={"email": "ghost@none.com"})
        assert resp.status_code == 200

    def test_reset_password_works(self, client, make_verified_user, captured_reset_tokens):
        make_verified_user(EMAIL, PASSWORD)
        client.post("/api/auth/forgot-password", json={"email": EMAIL})
        token = captured_reset_tokens[EMAIL][-1]
        new_pw = "BrandNewPass1!"
        resp = client.post("/api/auth/reset-password", json={
            "token": token, "new_password": new_pw,
        })
        assert resp.status_code == 200

        # Old password fails
        assert _signin(client, password=PASSWORD).status_code == 401
        # New password works
        assert _signin(client, password=new_pw).status_code == 200

    def test_reset_token_single_use(self, client, make_verified_user, captured_reset_tokens):
        make_verified_user(EMAIL, PASSWORD)
        client.post("/api/auth/forgot-password", json={"email": EMAIL})
        token = captured_reset_tokens[EMAIL][-1]
        client.post("/api/auth/reset-password", json={"token": token, "new_password": "Pass1234!"})
        resp = client.post("/api/auth/reset-password", json={"token": token, "new_password": "Again123!"})
        assert resp.status_code == 400

    def test_reset_revokes_existing_sessions(self, client, make_verified_user, captured_reset_tokens):
        tokens = make_verified_user(EMAIL, PASSWORD)
        old_rt = tokens["refresh_token"]
        client.post("/api/auth/forgot-password", json={"email": EMAIL})
        rt = captured_reset_tokens[EMAIL][-1]
        client.post("/api/auth/reset-password", json={"token": rt, "new_password": "Reset1234!"})
        resp = client.post("/api/auth/refresh", json={"refresh_token": old_rt})
        assert resp.status_code == 401


# ── 4. Role-Based Access Control ─────────────────────────────────────────


class TestRBAC:
    def test_candidate_blocked_from_recruiter_route(self, client, make_verified_user):
        tokens = make_verified_user(EMAIL, PASSWORD, role="candidate")
        h = {"Authorization": f"Bearer {tokens['access_token']}"}
        assert client.get("/api/auth/recruiter-only", headers=h).status_code == 403

    def test_candidate_blocked_from_admin_route(self, client, make_verified_user):
        tokens = make_verified_user(EMAIL, PASSWORD, role="candidate")
        h = {"Authorization": f"Bearer {tokens['access_token']}"}
        assert client.get("/api/auth/admin-only", headers=h).status_code == 403

    def test_recruiter_can_access_recruiter_route(self, client, make_verified_user):
        tokens = make_verified_user("rec@test.com", PASSWORD, role="recruiter")
        h = {"Authorization": f"Bearer {tokens['access_token']}"}
        assert client.get("/api/auth/recruiter-only", headers=h).status_code == 200

    def test_recruiter_blocked_from_admin_route(self, client, make_verified_user):
        tokens = make_verified_user("rec@test.com", PASSWORD, role="recruiter")
        h = {"Authorization": f"Bearer {tokens['access_token']}"}
        assert client.get("/api/auth/admin-only", headers=h).status_code == 403

    def test_unauthenticated_blocked_from_protected_routes(self, client):
        assert client.get("/api/auth/recruiter-only").status_code == 401
        assert client.get("/api/auth/admin-only").status_code == 401


# ── 5. Account Lockout ──────────────────────────────────────────────────


class TestLockout:
    def test_lockout_after_max_failures(self, client, make_verified_user):
        make_verified_user(EMAIL, PASSWORD)
        for _ in range(5):
            resp = _signin(client, password="BadPassword!")
            assert resp.status_code == 401
        # Correct password after lockout -> 423
        resp = _signin(client, password=PASSWORD)
        assert resp.status_code == 423
        assert "locked" in resp.json()["detail"].lower()

    def test_lockout_emits_auth_locked_audit(self, client, db, make_verified_user):
        from app.models.audit_log import AuditLog

        make_verified_user(EMAIL, PASSWORD)
        for _ in range(5):
            _signin(client, password="BadPassword!")
        logs = db.query(AuditLog).filter(AuditLog.action == "auth.locked").all()
        assert len(logs) >= 1

    def test_successful_login_resets_counter(self, client, make_verified_user):
        make_verified_user(EMAIL, PASSWORD)
        for _ in range(3):
            _signin(client, password="BadPassword!")
        assert _signin(client).status_code == 200
        for _ in range(3):
            _signin(client, password="BadPassword!")
        assert _signin(client).status_code == 200


# ── 6. Rate Limiting ────────────────────────────────────────────────────


class TestRateLimit:
    def test_verify_email_rate_limit(self, client, captured_otps):
        _signup(client)
        for _ in range(5):
            resp = _verify(client, EMAIL, "000000")
            assert resp.status_code == 400
        resp = _verify(client, EMAIL, "000000")
        assert resp.status_code == 429

    def test_signup_rate_limit(self, client):
        for i in range(5):
            _signup(client, email=f"user{i}@test.com")
        resp = _signup(client, email="extra@test.com")
        # Keyed per email, so first time for this email should be 200
        assert resp.status_code == 200


# ── 7. Logout ────────────────────────────────────────────────────────────


class TestLogout:
    def test_logout_revokes_session(self, client, make_verified_user):
        tokens = make_verified_user(EMAIL, PASSWORD)
        h = {"Authorization": f"Bearer {tokens['access_token']}"}
        resp = client.post("/api/auth/logout", json={
            "refresh_token": tokens["refresh_token"],
        }, headers=h)
        assert resp.status_code == 200
        # Refresh with that token should now fail
        resp = client.post("/api/auth/refresh", json={
            "refresh_token": tokens["refresh_token"],
        })
        assert resp.status_code == 401


# ── 8. Audit Logging ────────────────────────────────────────────────────


class TestAuditLog:
    def test_signup_creates_audit_entry(self, client, db, captured_otps):
        from app.models.audit_log import AuditLog

        _signup(client)
        otp = captured_otps[EMAIL][-1]
        _verify(client, EMAIL, otp)
        logs = db.query(AuditLog).filter(AuditLog.action == "auth.signup").all()
        assert len(logs) >= 1

    def test_signin_success_creates_audit_entry(self, client, db, make_verified_user):
        from app.models.audit_log import AuditLog

        make_verified_user(EMAIL, PASSWORD)
        _signin(client)
        logs = db.query(AuditLog).filter(AuditLog.action == "auth.login_success").all()
        assert len(logs) >= 1

    def test_signin_failure_creates_audit_entry(self, client, db, make_verified_user):
        from app.models.audit_log import AuditLog

        make_verified_user(EMAIL, PASSWORD)
        _signin(client, password="Wrong1234!")
        logs = db.query(AuditLog).filter(AuditLog.action == "auth.login_failed").all()
        assert len(logs) >= 1
