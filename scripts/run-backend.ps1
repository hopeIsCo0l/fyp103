# Run backend - SQLite by default (no Docker needed)
# For PostgreSQL: set DATABASE_URL in apps/api/.env before running
if (-not $env:DATABASE_URL -or $env:DATABASE_URL -like "*postgresql*") {
    # Use SQLite if no DB set or postgres fails
    $env:DATABASE_URL = "sqlite:///./recruit.db"
}
if (-not $env:SECRET_KEY) { $env:SECRET_KEY = "dev-secret-key" }

Set-Location "$PSScriptRoot\..\apps\api"
& .\venv\Scripts\Activate.ps1
python init_db.py
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
