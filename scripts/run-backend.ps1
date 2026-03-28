# Run backend — expects PostgreSQL (see docker/docker-compose.yml, port 5433 on host)
if (-not $env:DATABASE_URL) {
    $env:DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:5433/recruit_db"
}
if (-not $env:SECRET_KEY) { $env:SECRET_KEY = "dev-secret-key" }

Set-Location "$PSScriptRoot\..\apps\api"
& .\venv\Scripts\Activate.ps1
python init_db.py
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
