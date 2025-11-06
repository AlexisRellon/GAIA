# StackHawk Quick Setup Script
# Run this after getting your API key from https://app.stackhawk.com/settings/apikeys

Write-Host ""
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  StackHawk Setup for GAIA" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

# Check if API key is already set
if ($env:HAWK_API_KEY -and $env:HAWK_API_KEY -ne "hawk.xxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxx") {
    Write-Host "[OK] API Key already set" -ForegroundColor Green
} else {
    Write-Host "Enter your StackHawk API Key" -ForegroundColor Yellow
    Write-Host "Get it from: https://app.stackhawk.com/settings/apikeys" -ForegroundColor Gray
    $apiKey = Read-Host "API Key"
    
    if ($apiKey) {
        $env:HAWK_API_KEY = $apiKey
        Write-Host "[OK] API Key set!" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] API Key required to proceed" -ForegroundColor Red
        exit 1
    }
}

# Set application IDs (already configured)
$env:HAWK_APP_ID = "7757fbff-3cb0-4cb1-8a9c-e6cf896ecffc"
$env:HAWK_FRONTEND_APP_ID = "2038be8b-5252-4763-9d17-36f9da0cb9ba"

Write-Host ""
Write-Host "[OK] Backend App ID: 7757fbff-3cb0-4cb1-8a9c-e6cf896ecffc" -ForegroundColor Green
Write-Host "[OK] Frontend App ID: 2038be8b-5252-4763-9d17-36f9da0cb9ba" -ForegroundColor Green
Write-Host ""

# Verify Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "[OK] Docker is running" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  Configuration Complete!" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Environment Variables Set:" -ForegroundColor Cyan
Write-Host "  HAWK_API_KEY: ********" -ForegroundColor Gray
Write-Host "  HAWK_APP_ID: 7757fbff-3cb0-4cb1-8a9c-e6cf896ecffc" -ForegroundColor Gray
Write-Host "  HAWK_FRONTEND_APP_ID: 2038be8b-5252-4763-9d17-36f9da0cb9ba" -ForegroundColor Gray
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Load testing functions:" -ForegroundColor White
Write-Host "     . .\test-stackhawk.ps1" -ForegroundColor Yellow
Write-Host ""
Write-Host "  2. Run a quick test:" -ForegroundColor White
Write-Host "     Test-Quick" -ForegroundColor Yellow
Write-Host ""
Write-Host "  3. Or run full scans:" -ForegroundColor White
Write-Host "     Test-Backend    # Scan backend API" -ForegroundColor Yellow
Write-Host "     Test-Frontend   # Scan frontend PWA" -ForegroundColor Yellow
Write-Host "     Test-Both       # Scan both" -ForegroundColor Yellow
Write-Host ""
Write-Host "  4. View results:" -ForegroundColor White
Write-Host "     Backend:  https://app.stackhawk.com/applications/7757fbff-3cb0-4cb1-8a9c-e6cf896ecffc" -ForegroundColor Yellow
Write-Host "     Frontend: https://app.stackhawk.com/applications/2038be8b-5252-4763-9d17-36f9da0cb9ba" -ForegroundColor Yellow
Write-Host ""
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

# Offer to load test functions
Write-Host "Load test functions now? (Y/n): " -ForegroundColor Yellow -NoNewline
$response = Read-Host
if ($response -eq "" -or $response -eq "Y" -or $response -eq "y") {
    Write-Host "Loading test-stackhawk.ps1..." -ForegroundColor Cyan
    . .\test-stackhawk.ps1
    Write-Host ""
    Write-Host "[OK] Test functions loaded! Run Test-Backend to start." -ForegroundColor Green
    Write-Host ""
}
