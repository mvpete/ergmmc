# View Azure Function logs in real-time
Write-Host "Fetching logs from Application Insights..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

while ($true) {
    $result = az monitor app-insights query `
        --app ergmmc-insights `
        --resource-group ergmmc-reg `
        --analytics-query "traces | where timestamp > ago(5m) | order by timestamp desc | project timestamp, message, severityLevel" `
        --output json | ConvertFrom-Json

    Clear-Host
    Write-Host "=== Azure Function Logs (Last 5 minutes) ===" -ForegroundColor Cyan
    Write-Host "Last updated: $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Gray
    Write-Host ""

    if ($result.tables[0].rows.Count -eq 0) {
        Write-Host "No logs yet. Make a request to your app to see logs here." -ForegroundColor Yellow
    } else {
        foreach ($row in $result.tables[0].rows) {
            $timestamp = $row[0]
            $message = $row[1]
            $severity = $row[2]
            
            $color = switch ($severity) {
                0 { "Gray" }      # Verbose
                1 { "White" }     # Information
                2 { "Yellow" }    # Warning
                3 { "Red" }       # Error
                default { "White" }
            }
            
            Write-Host "[$timestamp] " -NoNewline -ForegroundColor Gray
            Write-Host $message -ForegroundColor $color
        }
    }

    Start-Sleep -Seconds 3
}
