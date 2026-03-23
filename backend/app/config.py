from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Use SQLite for quick local run when Docker/Postgres unavailable
    DATABASE_URL: str = "sqlite:///./recruit.db"
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
