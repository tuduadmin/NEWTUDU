# Start Vite dev server (port 5173, strictPort — fails if port is taken).
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $ProjectRoot

$connections = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
if ($connections) {
    $pids = $connections.OwningProcess | Sort-Object -Unique
    Write-Host ''
    Write-Host 'Port 5173 is already in use (Vite uses --strictPort and will not start).' -ForegroundColor Yellow
    foreach ($pid in $pids) {
        $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
        $name = if ($proc) { $proc.ProcessName } else { 'unknown' }
        Write-Host "  PID $pid ($name)"
    }
    Write-Host ''
    Write-Host 'Free the port, then run this script again:' -ForegroundColor Cyan
    Write-Host "  taskkill /PID $($pids -join ' /PID ') /F"
    Write-Host ''
    Read-Host 'Press Enter to close'
    exit 1
}

Write-Host ''
Write-Host 'Starting dev server. When Vite prints "ready", open:' -ForegroundColor Green
Write-Host '  http://localhost:5173/'
Write-Host '  http://localhost:5173/health'
Write-Host '  http://localhost:5173/admin/signin'
Write-Host 'Use the Network URL Vite prints (e.g. http://172.16.x.x:5173/) on other devices on your LAN.'
Write-Host ''

npm run dev
Read-Host 'Press Enter to close'
