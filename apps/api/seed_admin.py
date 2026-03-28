"""CLI entry: ensure super-admin exists (same logic as API startup).

Environment:
  ADMIN_EMAIL    (default: admin@recruit-system.com)
  ADMIN_PASSWORD (default: Admin123!)
  ADMIN_NAME     (default: Super Admin)
"""

from app.database import Base, engine
from app.models import OTP, AuditLog, PasswordResetToken, User, UserSession  # noqa: F401
from app.seed_admin_service import ensure_super_admin

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    ensure_super_admin()
    print("Done.")
