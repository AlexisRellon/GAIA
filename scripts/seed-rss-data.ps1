# GAIA - Seed RSS Data to Supabase Cloud
# This script applies the RSS data seeding migration to your Supabase database
# 
# Prerequisites:
# 1. Supabase project created
# 2. SUPABASE_URL and SUPABASE_KEY in .env file
# 3. Database migrations already applied (hazards table must exist)

param(
    [switch]$DryRun = $false,
    [switch]$ViewOnly = $false
)

# Script configuration
$ErrorActionPreference = "Stop"
$migrationFile = "backend\supabase\migrations\20251102000011_seed_rss_data.sql"

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "GAIA - RSS Data Seeding Script" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Load environment variables
if (Test-Path ".env") {
    Write-Host "Loading environment variables from .env..." -ForegroundColor Yellow
    Get-Content .env | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.+)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
} else {
    Write-Host "ERROR: .env file not found!" -ForegroundColor Red
    Write-Host "Create .env file with SUPABASE_URL and SUPABASE_KEY" -ForegroundColor Red
    exit 1
}

# Get Supabase credentials
$supabaseUrl = $env:SUPABASE_URL
$supabaseKey = $env:SUPABASE_KEY

if (-not $supabaseUrl -or -not $supabaseKey) {
    Write-Host "ERROR: Missing Supabase credentials!" -ForegroundColor Red
    Write-Host "Set SUPABASE_URL and SUPABASE_KEY in .env file" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Supabase URL: $supabaseUrl" -ForegroundColor Green
Write-Host "✓ API Key: $($supabaseKey.Substring(0,20))..." -ForegroundColor Green
Write-Host ""

# Check if migration file exists
if (-not (Test-Path $migrationFile)) {
    Write-Host "ERROR: Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Migration file found: $migrationFile" -ForegroundColor Green
Write-Host ""

# If view-only mode, just query existing data
if ($ViewOnly) {
    Write-Host "View-Only Mode: Querying existing hazards..." -ForegroundColor Yellow
    Write-Host ""
    
    $query = @"
SELECT 
    hazard_type,
    COUNT(*) as count,
    AVG(confidence_score) as avg_confidence
FROM gaia.hazards
GROUP BY hazard_type
ORDER BY count DESC
"@
    
    try {
        $body = @{
            query = $query
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod `
            -Uri "$supabaseUrl/rest/v1/rpc/exec_sql" `
            -Method Post `
            -Headers @{
                "apikey" = $supabaseKey
                "Authorization" = "Bearer $supabaseKey"
                "Content-Type" = "application/json"
            } `
            -Body $body
        
        Write-Host "Current hazards in database:" -ForegroundColor Cyan
        $response | Format-Table
        
    } catch {
        Write-Host "Note: Direct SQL query not available via REST API" -ForegroundColor Yellow
        Write-Host "Use Supabase Dashboard > SQL Editor to view data" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "To view data, go to:" -ForegroundColor Cyan
    Write-Host "$supabaseUrl/project/_/editor" -ForegroundColor White
    exit 0
}

# Dry run mode
if ($DryRun) {
    Write-Host "DRY RUN MODE: No changes will be made" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Migration file contents:" -ForegroundColor Cyan
    Write-Host "----------------------------------------------" -ForegroundColor Gray
    Get-Content $migrationFile | Select-Object -First 50
    Write-Host "..." -ForegroundColor Gray
    Write-Host "----------------------------------------------" -ForegroundColor Gray
    Write-Host ""
    Write-Host "This migration will insert:" -ForegroundColor Yellow
    Write-Host "  - 6 volcanic eruption events (Taal & Kanlaon)" -ForegroundColor White
    Write-Host "  - 3 earthquake events (Davao Oriental, Bogo)" -ForegroundColor White
    Write-Host "  - 1 flooding event (Hagonoy, Bulacan)" -ForegroundColor White
    Write-Host "  - 2 fire/chemical hazards (Bais Bay, Pagbilao)" -ForegroundColor White
    Write-Host "  - 1 landslide event (Bontoc)" -ForegroundColor White
    Write-Host "  Total: 13 hazard records" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Run without -DryRun flag to apply migration" -ForegroundColor Yellow
    exit 0
}

# Confirm before applying
Write-Host "This will seed RSS data into your Supabase database" -ForegroundColor Yellow
Write-Host "Source: Beo-Alvaro/rss-data repository (Oct 27 - Nov 2, 2025)" -ForegroundColor White
Write-Host ""
$confirm = Read-Host "Continue? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Aborted." -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "Applying migration..." -ForegroundColor Yellow

# Read migration file
$sqlContent = Get-Content $migrationFile -Raw

# Apply migration using Supabase SQL Editor API or psql
Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "MIGRATION OPTIONS" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 1: Supabase Dashboard (Recommended)" -ForegroundColor Green
Write-Host "  1. Go to: $supabaseUrl/project/_/sql" -ForegroundColor White
Write-Host "  2. Copy and paste contents of: $migrationFile" -ForegroundColor White
Write-Host "  3. Click 'Run' button" -ForegroundColor White
Write-Host ""
Write-Host "Option 2: Using psql (if installed)" -ForegroundColor Green
Write-Host "  psql `"postgresql://postgres:[password]@[host]:5432/postgres`" -f $migrationFile" -ForegroundColor White
Write-Host ""
Write-Host "Option 3: Copy SQL to clipboard (then paste in dashboard)" -ForegroundColor Green
$copyChoice = Read-Host "Copy SQL to clipboard? (y/N)"

if ($copyChoice -eq "y" -or $copyChoice -eq "Y") {
    $sqlContent | Set-Clipboard
    Write-Host "✓ SQL copied to clipboard!" -ForegroundColor Green
    Write-Host "Now paste it into Supabase SQL Editor: $supabaseUrl/project/_/sql" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "VERIFICATION QUERIES" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "After applying the migration, run these queries in SQL Editor:" -ForegroundColor Yellow
Write-Host ""

$verificationQuery = @"
-- Count total hazards
SELECT COUNT(*) as total_hazards FROM gaia.hazards;

-- Count by hazard type
SELECT 
    hazard_type,
    COUNT(*) as count,
    AVG(confidence_score) as avg_confidence
FROM gaia.hazards
GROUP BY hazard_type
ORDER BY count DESC;

-- View all seeded hazards
SELECT 
    hazard_type,
    severity,
    location_name,
    admin_division,
    confidence_score,
    source_published_at
FROM gaia.hazards
ORDER BY source_published_at DESC
LIMIT 20;
"@

Write-Host $verificationQuery -ForegroundColor White
Write-Host ""

# Save verification queries to file
$verificationFile = "verify-rss-seeding.sql"
$verificationQuery | Out-File -FilePath $verificationFile -Encoding UTF8
Write-Host "✓ Verification queries saved to: $verificationFile" -ForegroundColor Green

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "NEXT STEPS" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Apply migration in Supabase Dashboard" -ForegroundColor Yellow
Write-Host "2. Run verification queries to confirm data" -ForegroundColor Yellow
Write-Host "3. View hazards on frontend map" -ForegroundColor Yellow
Write-Host "4. Set up automated RSS fetching (see docs/guides/RSS_INTEGRATION_QUICK_START.md)" -ForegroundColor Yellow
Write-Host ""

# Open Supabase dashboard in browser
$openBrowser = Read-Host "Open Supabase SQL Editor in browser? (y/N)"
if ($openBrowser -eq "y" -or $openBrowser -eq "Y") {
    Start-Process "$supabaseUrl/project/_/sql"
}

Write-Host ""
Write-Host "Done! Check Supabase Dashboard to apply the migration." -ForegroundColor Green
Write-Host ""
