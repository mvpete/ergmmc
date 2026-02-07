#!/usr/bin/env pwsh
# Start all development services in parallel

Write-Host "Starting development environment..." -ForegroundColor Green

# Start the API proxy server in background
Write-Host "`nStarting API proxy server (port 3000)..." -ForegroundColor Cyan
$apiProxy = Start-Process powershell -ArgumentList "-NoExit", "-Command", "node dev-api-server.js" -PassThru

# Check if Azure Functions Core Tools is installed
$funcExists = Get-Command func -ErrorAction SilentlyContinue
if ($funcExists) {
    # Start Azure Functions in background
    Write-Host "Starting Azure Functions (port 7071)..." -ForegroundColor Cyan
    $functions = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd api; func start" -PassThru
    Start-Sleep -Seconds 2
} else {
    Write-Host "Azure Functions Core Tools not found - skipping" -ForegroundColor Yellow
    Write-Host "  Install with: npm install -g azure-functions-core-tools@4" -ForegroundColor Gray
    Write-Host "  (Not needed for local development - proxy handles API calls)" -ForegroundColor Gray
    $functions = $null
}

# Start Vite dev server in foreground (this one will show in current terminal)
Write-Host "`nStarting Vite dev server (port 5173)..." -ForegroundColor Cyan
Write-Host "`nPress Ctrl+C to stop all services`n" -ForegroundColor Yellow

try {
    npm run dev
} finally {
    # Cleanup: stop all background processes when Vite exits
    Write-Host "`n`nStopping all services..." -ForegroundColor Red
    Stop-Process -Id $apiProxy.Id -Force -ErrorAction SilentlyContinue
    if ($functions) {
        Stop-Process -Id $functions.Id -Force -ErrorAction SilentlyContinue
    }
    Write-Host "All services stopped." -ForegroundColor Green
}
