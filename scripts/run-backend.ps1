# Run backend - SQLite by default (no Docker needed)
# For PostgreSQL: $env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5433/recruit_db"
if (-not $env:DATABASE_URL) {
    $env:DATABASE_URL = "sqlite:///./recruit.db"
}
$env:SECRET_KEY = "dev-secret-key"

Set-Location "$PSScriptRoot\..\backend"
& .\venv\Scripts\Activate.ps1
python init_db.py
uvicorn app.main:app --host 0.0.0.0 --port 8000
