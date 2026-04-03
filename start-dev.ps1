#!/usr/bin/env pwsh
# Start all development services in parallel

Write-Host "Starting development environment..." -ForegroundColor Green

# Start the API proxy server in background
Write-Host "`nStarting API proxy server (port 3001)..." -ForegroundColor Cyan
$apiProxy = Start-Process powershell -ArgumentList "-NoExit", "-Command", "node dev-api-server.js" -PassThru

# Azure Functions are not started in dev mode - the dev-api-server handles all API calls
Write-Host "Using dev-api-server for API endpoints (Azure Functions not started)" -ForegroundColor Gray

# Start Vite dev server in foreground (this one will show in current terminal)
Write-Host "`nStarting Vite dev server (port 5173)..." -ForegroundColor Cyan
Write-Host "`nPress Ctrl+C to stop all services`n" -ForegroundColor Yellow

try {
    npm run dev
} finally {
    # Cleanup: stop all background processes when Vite exits
    Write-Host "`n`nStopping all services..." -ForegroundColor Red
    Stop-Process -Id $apiProxy.Id -Force -ErrorAction SilentlyContinue
    Write-Host "All services stopped." -ForegroundColor Green
}
