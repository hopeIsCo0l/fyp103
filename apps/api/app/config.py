from pathlib import Path

from pydantic_settings import BaseSettings

# Ensure .env is loaded from apps/api when running from project root
_env_path = Path(__file__).parent.parent / ".env"


class Settings(BaseSettings):
    # Use SQLite for quick local run when Docker/Postgres unavailable
    DATABASE_URL: str = "sqlite:///./recruit.db"
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # OTP
    OTP_EXPIRE_MINUTES: int = 10
    OTP_LENGTH: int = 6

    # Email (optional - if not set, OTP is logged to console in dev)
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "noreply@recruit.local"

    class Config:
        env_file = str(_env_path) if _env_path.exists() else ".env"
        extra = "ignore"


settings = Settings()
