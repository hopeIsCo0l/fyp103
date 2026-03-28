# Free ports used by Docker Compose (Postgres host 5433, web 5173, API 8000) and local 5432
# Run: powershell -ExecutionPolicy Bypass -File .\scripts\free-ports.ps1
$ports = @(5432, 5433, 5173, 8000)

foreach ($port in $ports) {
    try {
        $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    } catch {
        $conn = $null
    }

    if ($conn) {
        $pids = $conn.OwningProcess | Select-Object -Unique
        foreach ($procId in $pids) {
            try {
                $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
                if ($proc) {
                    Write-Host "Stopping $($proc.ProcessName) (PID $procId) on port $port"
                    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
                }
            } catch { }
        }
    } else {
        # Fallback: netstat
        $line = netstat -ano | Select-String ":$port\s+.*LISTENING"
        if ($line) {
            $parts = $line -split '\s+'
            $pid = $parts[-1]
            if ($pid -match '^\d+$') {
                Write-Host "Stopping process PID $pid on port $port"
                taskkill /F /PID $pid 2>$null
            }
        } else {
            Write-Host "Port $port is free"
        }
    }
}
Write-Host "Done. Wait a few seconds, then run: .\scripts\docker-up.ps1"
