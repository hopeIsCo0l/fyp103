"""Shared test fixtures: isolated in-memory DB, TestClient, OTP capture."""

import os

# Force SQLite in-memory BEFORE any app module is imported so that
# database.py / main.py never try to connect to PostgreSQL.
os.environ["DATABASE_URL"] = "sqlite://"

from collections import defaultdict
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app

# ---------------------------------------------------------------------------
# In-memory SQLite engine – StaticPool keeps one shared connection so that
# table creation and request handling see the same database.
# ---------------------------------------------------------------------------
engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@event.listens_for(engine, "connect")
def _set_sqlite_pragma(dbapi_conn, _):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------
@pytest.fixture(autouse=True)
def _setup_db():
    """Create all tables before each test; drop after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


def _override_get_db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(autouse=True)
def _override_deps():
    """Swap the production DB dependency with the test DB for every request."""
    app.dependency_overrides[get_db] = _override_get_db
    yield
    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def _clear_rate_limit_store():
    """Reset in-memory rate-limit buckets between tests."""
    from app.auth.rate_limit import _store

    _store.clear()
    yield
    _store.clear()


# ---------------------------------------------------------------------------
# OTP capture: monkeypatch send_otp_email so we can grab the plaintext OTP
# without needing SMTP or log scraping.
# ---------------------------------------------------------------------------
_captured_otps: dict[str, list[str]] = defaultdict(list)
_captured_reset_tokens: dict[str, list[str]] = defaultdict(list)


def _fake_send_otp(to_email: str, otp: str, purpose: str = "verification") -> bool:
    _captured_otps[to_email.lower()].append(otp)
    return True


def _fake_send_reset(to_email: str, token: str) -> bool:
    _captured_reset_tokens[to_email.lower()].append(token)
    return True


@pytest.fixture(autouse=True)
def _patch_email():
    """Replace real email senders with in-memory capture."""
    _captured_otps.clear()
    _captured_reset_tokens.clear()
    with (
        patch("app.auth.otp_service.send_otp_email", side_effect=_fake_send_otp),
        patch("app.auth.email_service.send_password_reset_email", side_effect=_fake_send_reset),
    ):
        yield


@pytest.fixture()
def captured_otps():
    return _captured_otps


@pytest.fixture()
def captured_reset_tokens():
    return _captured_reset_tokens


@pytest.fixture()
def client():
    return TestClient(app)


# ---------------------------------------------------------------------------
# Helper: register + verify a user in one shot and return tokens.
# ---------------------------------------------------------------------------
@pytest.fixture()
def make_verified_user(client, captured_otps):
    def _make(email: str, password: str, full_name: str = "Test User", role: str = "candidate"):
        client.post("/api/auth/signup", json={
            "email": email, "password": password, "full_name": full_name,
        })
        otp = captured_otps[email.lower()][-1]
        resp = client.post("/api/auth/verify-email", json={"email": email, "otp": otp})
        data = resp.json()
        # Signup always creates candidates; override role directly in DB if needed
        if role != "candidate":
            from app.models.user import User

            session = TestingSessionLocal()
            user = session.query(User).filter(User.email == email.lower()).first()
            if user:
                user.role = role
                session.commit()
            session.close()
        return {
            "access_token": data["access_token"],
            "refresh_token": data["refresh_token"],
            "user": data["user"],
        }
    return _make
