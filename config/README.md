# GAIA Configuration Directory

This directory contains all project configuration files organized by purpose.

## 📂 Directory Structure

### `/stackhawk` - Security Scanning Configurations

Security vulnerability scanning configurations for different environments and scopes.

#### Configuration Files

##### `stackhawk.yml` (Primary Configuration)
**Purpose**: Main StackHawk configuration for backend API  
**Target**: http://localhost:8000  
**Application ID**: `7757fbff-3cb0-4cb1-8a9c-e6cf896ecffc`  
**Scan Time**: ~5 minutes  
**Use When**: Regular backend security testing

##### `stackhawk-frontend.yml`
**Purpose**: Frontend PWA security scanning  
**Target**: http://localhost:3000  
**Application ID**: `2038be8b-5252-4763-9d17-36f9da0cb9ba`  
**Scan Time**: ~10 minutes  
**Use When**: Testing React application security

##### `stackhawk-quick.yml`
**Purpose**: Fast backend scan for quick checks  
**Target**: http://localhost:8000  
**Scan Time**: ~30 seconds  
**Use When**: Rapid validation during development

##### `stackhawk-backend-simple.yml`
**Purpose**: Simplified backend configuration  
**Target**: http://localhost:8000  
**Use When**: Basic backend API testing

##### `stackhawk-production.yml`
**Purpose**: Production environment scanning  
**Target**: Production URLs (Heroku deployment)  
**Use When**: Pre-deployment and production monitoring

## 🚀 Usage

### Running Scans

```powershell
# Backend scan (primary)
hawk scan config\stackhawk\stackhawk.yml

# Frontend scan
hawk scan config\stackhawk\stackhawk-frontend.yml

# Quick validation
hawk scan config\stackhawk\stackhawk-quick.yml

# Production scan
hawk scan config\stackhawk\stackhawk-production.yml
```

### Using Test Scripts

For convenience, use the wrapper scripts:

```powershell
# Load test functions
. .\scripts\test-stackhawk.ps1

# Run scans
Test-Backend     # Uses stackhawk.yml
Test-Frontend    # Uses stackhawk-frontend.yml
Test-Quick       # Uses stackhawk-quick.yml
Test-Both        # Runs both backend and frontend
```

## 🔧 Configuration Structure

All StackHawk configurations follow this structure:

```yaml
app:
  applicationId: <UUID>          # Unique app identifier
  env: Development               # Environment name
  host: http://localhost:PORT    # Target URL

hawk:
  spider:
    base: true                   # Enable base spidering
    ajax: true                   # Enable AJAX spidering
    maxDuration: 5               # Max spider duration (minutes)
```

## 🔐 Environment Variables

Required environment variables (set in `.env.stackhawk`):

- `STACKHAWK_API_KEY` - Your StackHawk API key (required)
- `GAIA_BACKEND_URL` - Backend URL override (optional)
- `GAIA_FRONTEND_URL` - Frontend URL override (optional)

## 📊 Application IDs

### Backend Application
- **ID**: `7757fbff-3cb0-4cb1-8a9c-e6cf896ecffc`
- **Dashboard**: https://app.stackhawk.com/applications/7757fbff-3cb0-4cb1-8a9c-e6cf896ecffc
- **Name**: GAIA Backend API
- **Environment**: Development

### Frontend Application
- **ID**: `2038be8b-5252-4763-9d17-36f9da0cb9ba`
- **Dashboard**: https://app.stackhawk.com/applications/2038be8b-5252-4763-9d17-36f9da0cb9ba
- **Name**: GAIA Frontend PWA
- **Environment**: Development

## 🎯 Scan Profiles

| Configuration | Target | Duration | Use Case |
|--------------|--------|----------|----------|
| **stackhawk.yml** | Backend | 5 min | Regular backend testing |
| **stackhawk-frontend.yml** | Frontend | 10 min | PWA security testing |
| **stackhawk-quick.yml** | Backend | 30 sec | Quick validation |
| **stackhawk-backend-simple.yml** | Backend | 5 min | Basic API testing |
| **stackhawk-production.yml** | Production | Varies | Pre-deployment checks |

## 🛡️ Security Best Practices

1. **Never commit `.env.stackhawk`** - Contains API keys
2. **Review findings immediately** - Check dashboard after scans
3. **Scan before deployment** - Use production config pre-deploy
4. **Regular scanning** - Schedule weekly scans minimum
5. **Fix critical issues first** - Prioritize high-severity findings

## 🔄 Customization

### Adding New Endpoints

Edit the appropriate config file and add to the spider section:

```yaml
hawk:
  spider:
    base: true
    ajax: true
    # Add custom paths
    includePaths:
      - "/api/v1/.*"
      - "/public/.*"
```

### Adjusting Scan Duration

Modify the `maxDuration` value:

```yaml
hawk:
  spider:
    maxDuration: 10  # Increase for more thorough scans
```

### Environment-Specific Settings

For different environments, create new config files:

```bash
cp config/stackhawk/stackhawk.yml config/stackhawk/stackhawk-staging.yml
# Edit staging-specific settings
```

## 📚 Related Documentation

- **[StackHawk Testing Guide](../docs/security/STACKHAWK_TESTING_GUIDE.md)** - Comprehensive testing guide
- **[StackHawk Quick Reference](../docs/security/STACKHAWK_QUICK_REFERENCE.md)** - Command cheat sheet
- **[Security Audit](../docs/security/SECURITY_AUDIT.md)** - Security audit findings
- **[Scripts README](../scripts/README.md)** - Test script documentation

## 🆘 Troubleshooting

### Scan Fails to Start
```powershell
# Validate configuration
hawk config config\stackhawk\stackhawk.yml

# Check service is running
curl http://localhost:8000/health
```

### Authentication Errors
```powershell
# Verify API key is set
echo $env:STACKHAWK_API_KEY

# Check .env.stackhawk exists
Test-Path .env.stackhawk
```

### Timeout Issues
Increase `maxDuration` in config or use `stackhawk-quick.yml` for faster scans.

---

**Last Updated**: November 2, 2025
