@echo off
echo Starting development environment...
echo.

echo Starting API proxy server (port 3000)...
start "API Proxy" cmd /k "node dev-api-server.js"

where func >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Starting Azure Functions (port 7071)...
    start "Azure Functions" cmd /k "cd api && func start"
    timeout /t 2 /nobreak >nul
) else (
    echo Azure Functions Core Tools not found - skipping
    echo   Install with: npm install -g azure-functions-core-tools@4
    echo   (Not needed for local development - proxy handles API calls)
    echo.
)

echo Starting Vite dev server (port 5173)...
echo.
echo Press Ctrl+C to stop Vite (you'll need to manually close other windows)
echo.

npm run dev
