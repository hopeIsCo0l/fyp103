# Run the full stack from docker/ (Postgres + API + Vite).
# Usage: powershell -ExecutionPolicy Bypass -File .\scripts\docker-up.ps1
# Optional args are passed to docker compose (e.g. -d)

$dockerDir = (Resolve-Path (Join-Path $PSScriptRoot "..\docker")).Path
Set-Location $dockerDir

$envExample = Join-Path $dockerDir ".env.example"
$envFile = Join-Path $dockerDir ".env"
if (-not (Test-Path $envFile) -and (Test-Path $envExample)) {
    Write-Host "Creating docker/.env from .env.example (edit secrets for production)"
    Copy-Item $envExample $envFile
}

docker compose up --build @args
