# GAIA Scripts Directory

This directory contains utility scripts for setup, testing, and automation.

## 🔧 Setup Scripts

### `setup.ps1`
**Purpose**: Main project setup script  
**Usage**:
```powershell
.\scripts\setup.ps1
```
**What it does**:
- Installs Python dependencies
- Sets up frontend npm packages
- Configures environment variables
- Initializes database

### `setup-stackhawk.ps1`
**Purpose**: Configure StackHawk security scanning  
**Usage**:
```powershell
.\scripts\setup-stackhawk.ps1
```
**What it does**:
- Installs StackHawk CLI
- Validates configuration files
- Sets up API keys
- Tests connection to StackHawk platform

### `seed-rss-data.ps1`
**Purpose**: Seed RSS data from Beo-Alvaro's repository into Supabase  
**Usage**:
```powershell
# Preview without changes
.\scripts\seed-rss-data.ps1 -DryRun

# View existing data
.\scripts\seed-rss-data.ps1 -ViewOnly

# Apply seeding (opens Supabase dashboard)
.\scripts\seed-rss-data.ps1
```
**What it does**:
- Loads Supabase credentials from `.env`
- Validates database connection
- Copies SQL to clipboard
- Opens Supabase SQL Editor
- Provides verification queries

**Related Documentation**: [docs/setup/RSS_SEEDING_GUIDE.md](../docs/setup/RSS_SEEDING_GUIDE.md)

## 🧪 Testing Scripts

### `test-stackhawk.ps1`
**Purpose**: Run StackHawk security scans  
**Usage**:
```powershell
# Load functions
. .\scripts\test-stackhawk.ps1

# Run specific tests
Test-Backend     # Backend API scan (5 min)
Test-Frontend    # Frontend PWA scan (10 min)
Test-Quick       # Quick backend scan (30 sec)
Test-Both        # Full stack scan (15 min)
```
**What it does**:
- Provides convenient test functions
- Runs security vulnerability scans
- Generates reports
- Links to StackHawk dashboard

**Related Documentation**: [docs/security/STACKHAWK_TESTING_GUIDE.md](../docs/security/STACKHAWK_TESTING_GUIDE.md)

### `test-security-headers.ps1`
**Purpose**: Verify HTTP security headers  
**Usage**:
```powershell
.\scripts\test-security-headers.ps1
```
**What it does**:
- Checks for OWASP security headers
- Validates CSP, HSTS, X-Frame-Options
- Tests CORS configuration
- Generates security report

**Related Documentation**: [docs/security/SECURITY_HEADERS_QUICK_REF.md](../docs/security/SECURITY_HEADERS_QUICK_REF.md)

## 📝 Prerequisites

All scripts require:
- **PowerShell 5.1+** (Windows) or PowerShell Core 7+ (cross-platform)
- **Admin privileges** for some installation tasks
- **Internet connection** for package downloads

### Backend Testing Prerequisites
- Python 3.9+ with virtual environment activated
- Backend server running on `http://localhost:8000`

### Frontend Testing Prerequisites
- Node.js 16+ with npm
- Frontend dev server running on `http://localhost:3000`

## 🚀 Quick Start Workflow

```powershell
# 1. Initial setup
.\scripts\setup.ps1

# 2. Configure security testing
.\scripts\setup-stackhawk.ps1

# 3. Start services (in separate terminals)
docker-compose up --build

# 4. Run security tests
. .\scripts\test-stackhawk.ps1
Test-Both

# 5. Verify security headers
.\scripts\test-security-headers.ps1
```

## 🔒 Security Best Practices

When running security scripts:
1. **Never commit** `.env` or `.env.stackhawk` files
2. **Use test data** for security scans (no production data)
3. **Review findings** in StackHawk dashboard after scans
4. **Fix critical issues** before deployment
5. **Re-scan** after applying security fixes

## 📊 Script Exit Codes

All scripts follow standard exit codes:
- `0` - Success
- `1` - General error
- `2` - Configuration error
- `3` - Service not running
- `4` - Authentication failed

## 🛠️ Customization

### Environment Variables
Scripts respect these environment variables:
- `GAIA_BACKEND_URL` - Override backend URL (default: http://localhost:8000)
- `GAIA_FRONTEND_URL` - Override frontend URL (default: http://localhost:3000)
- `STACKHAWK_API_KEY` - StackHawk API key (required for scans)

### Configuration Files
- `.env` - Main environment configuration
- `.env.stackhawk` - StackHawk-specific settings
- `stackhawk*.yml` - StackHawk scan configurations

## 📚 Related Documentation

- [StackHawk Testing Guide](../docs/security/STACKHAWK_TESTING_GUIDE.md)
- [Security Quick Reference](../docs/security/STACKHAWK_QUICK_REFERENCE.md)
- [Quick Start Guide](../docs/setup/QUICK_START.md)
- [Docker Guide](../docs/guides/DOCKER_GUIDE.md)

---

**Last Updated**: November 2, 2025
