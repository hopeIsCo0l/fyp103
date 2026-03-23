# Start PostgreSQL only. Run backend and frontend in separate terminals:
#   Terminal 2: .\scripts\run-backend.ps1
#   Terminal 3: .\scripts\run-frontend.ps1

Write-Host "Starting PostgreSQL (Docker)..." -ForegroundColor Cyan
Set-Location "$PSScriptRoot\.."
docker-compose up -d postgres

Write-Host "`nPostgreSQL starting. Next steps:" -ForegroundColor Green
Write-Host "  Terminal 2: .\scripts\run-backend.ps1"
Write-Host "  Terminal 3: .\scripts\run-frontend.ps1"
Write-Host "  Then open: http://localhost:5173"
