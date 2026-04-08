from pathlib import Path

from pydantic_settings import BaseSettings

# Ensure .env is loaded from apps/api when running from project root
_env_path = Path(__file__).parent.parent / ".env"


class Settings(BaseSettings):
    # Local dev: run `docker compose -f docker/docker-compose.yml up -d postgres` (port 5433)
    DATABASE_URL: str = "postgresql://postgres:postgres@127.0.0.1:5433/recruit_db"
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    PASSWORD_RESET_EXPIRE_MINUTES: int = 30

    # OTP
    OTP_EXPIRE_MINUTES: int = 10
    OTP_LENGTH: int = 6
    OTP_MAX_ATTEMPTS_PER_HOUR: int = 5

    # Auth security controls
    SIGNIN_MAX_ATTEMPTS: int = 5
    SIGNIN_LOCK_MINUTES: int = 15
    SIGNIN_ATTEMPT_WINDOW_MINUTES: int = 30

    # Email (optional - if not set, OTP is logged to console in dev)
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "noreply@recruit.local"

    # Optional external scorer: if set, job apply / score preview call POST {base}/v1/score
    # and fall back to the in-process scorer on remote errors or excluded jobs.
    EA_CV_SCORER_URL: str = ""
    EA_CV_SCORER_TIMEOUT_SEC: float = 5.0

    class Config:
        env_file = str(_env_path) if _env_path.exists() else ".env"
        extra = "ignore"


settings = Settings()
