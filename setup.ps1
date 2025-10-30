# GAIA Foundation Setup Script
# Run this script after the foundation files are created

Write-Host "=== GAIA Foundation Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if virtual environment exists
if (Test-Path "venv\Scripts\Activate.ps1") {
    Write-Host "✓ Virtual environment found" -ForegroundColor Green
} else {
    Write-Host "✗ Virtual environment not found. Creating..." -ForegroundColor Yellow
    python -m venv venv
    Write-Host "✓ Virtual environment created" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Installing Python Dependencies ===" -ForegroundColor Cyan

# Activate virtual environment and install dependencies
& .\venv\Scripts\Activate.ps1

Write-Host "Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip

Write-Host "Installing Python packages (this may take a while)..." -ForegroundColor Yellow
pip install transformers torch nltk scikit-learn numpy supabase psycopg2-binary requests feedparser python-dotenv geopy pytest pytest-cov pytest-asyncio black flake8

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Python dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✗ Python installation encountered errors" -ForegroundColor Red
    Write-Host "  Note: Some packages may require Visual Studio Build Tools" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Downloading spaCy Language Model ===" -ForegroundColor Cyan
python -m spacy download en_core_web_sm
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ spaCy model downloaded" -ForegroundColor Green
} else {
    Write-Host "⚠ spaCy model download skipped (install spacy first)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Installing Pre-commit Hooks ===" -ForegroundColor Cyan
pip install pre-commit
pre-commit install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Pre-commit hooks installed" -ForegroundColor Green
} else {
    Write-Host "⚠ Pre-commit hooks installation skipped" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Frontend Setup ===" -ForegroundColor Cyan

if (Test-Path "frontend\node_modules") {
    Write-Host "✓ Frontend dependencies already installed" -ForegroundColor Green
} else {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "✗ Frontend installation encountered errors" -ForegroundColor Red
    }
    Set-Location ..
}

Write-Host ""
Write-Host "=== Environment Files ===" -ForegroundColor Cyan

# Create .env files from examples if they don't exist
if (-not (Test-Path "backend\.env")) {
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "✓ Created backend\.env (please configure with your credentials)" -ForegroundColor Yellow
} else {
    Write-Host "✓ backend\.env already exists" -ForegroundColor Green
}

if (-not (Test-Path "frontend\.env")) {
    Copy-Item "frontend\.env.example" "frontend\.env"
    Write-Host "✓ Created frontend\.env (please configure with your credentials)" -ForegroundColor Yellow
} else {
    Write-Host "✓ frontend\.env already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Configure backend\.env with Supabase credentials" -ForegroundColor White
Write-Host "2. Configure frontend\.env with API keys" -ForegroundColor White
Write-Host "3. Install Supabase CLI: npm install -g supabase" -ForegroundColor White
Write-Host "4. Initialize Supabase: supabase init" -ForegroundColor White
Write-Host "5. Start development:" -ForegroundColor White
Write-Host "   - Backend: python backend/python/main.py" -ForegroundColor Gray
Write-Host "   - Frontend: cd frontend && npm start" -ForegroundColor Gray
Write-Host ""
Write-Host "For detailed instructions, see README.md and SETUP_STATUS.md" -ForegroundColor Yellow
Write-Host ""
