# StackHawk Security Verification Script
# Tests that all 5 security issues have been fixed

Write-Host "GAIA Security Headers Verification" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Function to test security headers
function Test-SecurityHeaders {
    param (
        [string]$Url,
        [string]$Environment
    )
    
    Write-Host "Testing $Environment environment: $Url" -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -UseBasicParsing -ErrorAction Stop
        $headers = $response.Headers
        
        $results = @{
            "X-Frame-Options" = $headers["X-Frame-Options"] -ne $null
            "X-Content-Type-Options" = $headers["X-Content-Type-Options"] -ne $null
            "Content-Security-Policy" = $headers["Content-Security-Policy"] -ne $null
            "X-XSS-Protection" = $headers["X-XSS-Protection"] -ne $null
            "X-Powered-By-Absent" = $headers["X-Powered-By"] -eq $null
        }
        
        Write-Host ""
        Write-Host "Security Headers Status:" -ForegroundColor White
        
        foreach ($header in $results.GetEnumerator() | Sort-Object Name) {
            $status = if ($header.Value) { "[PASS]" } else { "[FAIL]" }
            $color = if ($header.Value) { "Green" } else { "Red" }
            
            Write-Host "  $($header.Key): " -NoNewline
            Write-Host $status -ForegroundColor $color
            
            # Show actual header value if present
            if ($header.Value -and $header.Key -ne "X-Powered-By-Absent") {
                $actualHeader = $header.Key
                if ($headers[$actualHeader]) {
                    Write-Host "    Value: $($headers[$actualHeader])" -ForegroundColor Gray
                }
            }
        }
        
        $passCount = ($results.Values | Where-Object { $_ -eq $true }).Count
        $totalCount = $results.Count
        
        Write-Host ""
        Write-Host "Overall: $passCount/$totalCount checks passed" -ForegroundColor $(if ($passCount -eq $totalCount) { "Green" } else { "Yellow" })
        Write-Host ""
        
        return $passCount -eq $totalCount
        
    } catch {
        Write-Host "❌ Error connecting to $Url" -ForegroundColor Red
        Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        return $false
    }
}

# Test Frontend (Development)
$frontendRunning = $false
try {
    $test = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    $frontendRunning = $true
} catch {
    # Frontend not running
}

if ($frontendRunning) {
    Write-Host "Frontend (Development Server)" -ForegroundColor Magenta
    Write-Host "=================================" -ForegroundColor Magenta
    $frontendResult = Test-SecurityHeaders -Url "http://localhost:3000" -Environment "Development"
} else {
    Write-Host "Frontend not running at http://localhost:3000" -ForegroundColor Yellow
    Write-Host "   Start with: cd frontend; npm start" -ForegroundColor Gray
    Write-Host ""
}

# Test Backend API
$backendRunning = $false
try {
    $test = Invoke-WebRequest -Uri "http://localhost:8000/health" -Method GET -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    $backendRunning = $true
} catch {
    # Backend not running
}

if ($backendRunning) {
    Write-Host "Backend API" -ForegroundColor Magenta
    Write-Host "===============" -ForegroundColor Magenta
    $backendResult = Test-SecurityHeaders -Url "http://localhost:8000/health" -Environment "Backend"
} else {
    Write-Host "Backend not running at http://localhost:8000" -ForegroundColor Yellow
    Write-Host "   Start with: cd backend/python; uvicorn main:app --reload" -ForegroundColor Gray
    Write-Host ""
}

# Summary
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

if ($frontendRunning -or $backendRunning) {
    if ($frontendRunning -and $frontendResult) {
        Write-Host "[PASS] Frontend: All security headers configured correctly" -ForegroundColor Green
    } elseif ($frontendRunning) {
        Write-Host "[WARN] Frontend: Some security headers missing" -ForegroundColor Yellow
    }
    
    if ($backendRunning -and $backendResult) {
        Write-Host "[PASS] Backend: All security headers configured correctly" -ForegroundColor Green
    } elseif ($backendRunning) {
        Write-Host "[WARN] Backend: Some security headers missing" -ForegroundColor Yellow
    }
} else {
    Write-Host "[FAIL] No services running. Please start frontend and/or backend." -ForegroundColor Red
}

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Start services if not running" -ForegroundColor Gray
Write-Host "  2. Verify headers pass all checks" -ForegroundColor Gray
Write-Host "  3. Run StackHawk scan: .\test-stackhawk.ps1; Test-Frontend" -ForegroundColor Gray
Write-Host "  4. Check STACKHAWK_SECURITY_FIXES.md for details" -ForegroundColor Gray
Write-Host ""
