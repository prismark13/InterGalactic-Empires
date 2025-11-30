$ErrorActionPreference = 'Continue'

# Test ping endpoint
Write-Host "Testing /ping endpoint..." 
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/ping" -Method Get -ErrorAction Stop
    Write-Host "✓ Ping successful:" -ForegroundColor Green
    $response | Format-List
} catch {
    Write-Host "✗ Ping failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

# Test command endpoint - Scan Sector
Write-Host "`nTesting Scan Sector command..." -ForegroundColor Cyan
try {
    $body = @{ command = 'Scan Sector' } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "http://localhost:3000/command" -Method Post -Body $body -ContentType 'application/json' -ErrorAction Stop
    Write-Host "✓ Command successful. Location: $($response.meta.location)" -ForegroundColor Green
} catch {
    Write-Host "✗ Command failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}
