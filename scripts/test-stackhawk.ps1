# StackHawk Local Testing Script
# Quick commands for running security scans locally

# Set this to your StackHawk API key
# Get it from: https://app.stackhawk.com/settings/apikeys
$env:HAWK_API_KEY = "hawk.xxxxxxxxxx.xxxxxxxxxx"

# Set application IDs from your StackHawk dashboard
# Backend: https://app.stackhawk.com/applications/7757fbff-3cb0-4cb1-8a9c-e6cf896ecffc
$env:HAWK_APP_ID = "7757fbff-3cb0-4cb1-8a9c-e6cf896ecffc"
# Frontend: https://app.stackhawk.com/applications/2038be8b-5252-4763-9d17-36f9da0cb9ba
$env:HAWK_FRONTEND_APP_ID = "2038be8b-5252-4763-9d17-36f9da0cb9ba"

function Test-Backend {
    Write-Host "[SCAN] Starting Backend Security Scan..." -ForegroundColor Cyan
    
    # Set environment variables for this scan
    $env:HAWK_APP_ID = "7757fbff-3cb0-4cb1-8a9c-e6cf896ecffc"
    $env:APP_HOST = "http://localhost:8000"
    $env:HAWK_ENV = "Development"
    
    # Start backend
    docker-compose up -d backend
    Start-Sleep -Seconds 10
    
    # Check health
    try {
        $health = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing
        Write-Host "[OK] Backend is healthy" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] Backend health check failed!" -ForegroundColor Red
        return
    }
    
    # Run scan
    if (Get-Command hawk -ErrorAction SilentlyContinue) {
        hawk scan ..\config\stackhawk\stackhawk-backend-simple.yml
    } else {
        Write-Host "Using Docker to run scan..." -ForegroundColor Yellow
        docker run --rm --network host `
            -e API_KEY=$env:HAWK_API_KEY `
            -e HAWK_APP_ID=$env:HAWK_APP_ID `
            -v ${PWD}:/hawk:rw `
            -t stackhawk/hawkscan:latest config/stackhawk/stackhawk-backend-simple.yml
    }
    
    Write-Host "[OK] Backend scan complete!" -ForegroundColor Green
    Write-Host "View results: https://app.stackhawk.com/" -ForegroundColor Cyan
}

function Test-Frontend {
    Write-Host "[SCAN] Starting Frontend Security Scan..." -ForegroundColor Cyan
    
    # Set environment variables for this scan
    $env:HAWK_FRONTEND_APP_ID = "2038be8b-5252-4763-9d17-36f9da0cb9ba"
    $env:APP_HOST = "http://localhost:3000"
    $env:HAWK_ENV = "Development"
    
    # Start frontend
    docker-compose up -d frontend
    Start-Sleep -Seconds 15
    
    # Check health
    try {
        $health = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing
        Write-Host "[OK] Frontend is serving" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] Frontend health check failed!" -ForegroundColor Red
        return
    }
    
    # Run scan
    if (Get-Command hawk -ErrorAction SilentlyContinue) {
        hawk scan ..\config\stackhawk\stackhawk-frontend.yml
    } else {
        Write-Host "Using Docker to run scan..." -ForegroundColor Yellow
        docker run --rm --network host `
            -e API_KEY=$env:HAWK_API_KEY `
            -e HAWK_FRONTEND_APP_ID=$env:HAWK_FRONTEND_APP_ID `
            -v ${PWD}:/hawk:rw `
            -t stackhawk/hawkscan:latest config/stackhawk/stackhawk-frontend.yml
    }
    
    Write-Host "[OK] Frontend scan complete!" -ForegroundColor Green
    Write-Host "View results: https://app.stackhawk.com/" -ForegroundColor Cyan
}

function Test-Both {
    Write-Host "[SCAN] Starting Full Stack Security Scan..." -ForegroundColor Cyan
    
    # Start all services
    docker-compose up -d
    Start-Sleep -Seconds 30
    
    # Scan backend
    Test-Backend
    
    # Scan frontend
    Test-Frontend
    
    Write-Host "[OK] Full stack scan complete!" -ForegroundColor Green
}

function Test-Quick {
    Write-Host "[SCAN] Running Quick Backend Scan (root only)..." -ForegroundColor Cyan
    
    # Set environment variables for this scan
    $env:HAWK_APP_ID = "7757fbff-3cb0-4cb1-8a9c-e6cf896ecffc"
    $env:APP_HOST = "http://localhost:8000"
    $env:HAWK_ENV = "Development"
    
    docker-compose up -d backend
    Start-Sleep -Seconds 10
    
    if (Get-Command hawk -ErrorAction SilentlyContinue) {
        hawk scan ..\config\stackhawk\stackhawk-quick.yml
    } else {
        docker run --rm --network host `
            -e API_KEY=$env:HAWK_API_KEY `
            -e HAWK_APP_ID=$env:HAWK_APP_ID `
            -v ${PWD}:/hawk:rw `
            -t stackhawk/hawkscan:latest config/stackhawk/stackhawk-quick.yml
    }
}

function Show-Help {
    Write-Host ""
    Write-Host "StackHawk Testing Commands" -ForegroundColor Cyan
    Write-Host "==========================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Test-Backend" -ForegroundColor Yellow -NoNewline
    Write-Host "  - Scan backend API (FastAPI)"
    Write-Host "Test-Frontend" -ForegroundColor Yellow -NoNewline
    Write-Host " - Scan frontend PWA (React)"
    Write-Host "Test-Both" -ForegroundColor Yellow -NoNewline
    Write-Host "     - Scan both backend and frontend"
    Write-Host "Test-Quick" -ForegroundColor Yellow -NoNewline
    Write-Host "    - Quick backend scan (root endpoint only)"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Cyan
    Write-Host "  Test-Backend"
    Write-Host "  Test-Frontend"
    Write-Host "  Test-Both"
    Write-Host "  Test-Quick"
    Write-Host ""
    Write-Host "Requirements:" -ForegroundColor Cyan
    Write-Host "  1. Set HAWK_API_KEY environment variable"
    Write-Host "  2. Set HAWK_APP_ID and HAWK_FRONTEND_APP_ID"
    Write-Host "  3. Docker must be running"
    Write-Host ""
}

# Show help on load
Show-Help
