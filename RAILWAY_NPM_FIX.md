# Railway NPM Warning Fix - Step by Step

## Problem
```
npm warn config production Use `--omit=dev` instead.
```

## Root Cause
Railway's default Nixpacks bruger stadig den gamle `--production` flag i stedet for den nye `--omit=dev`.

## Solution Files

### 1. `.npmrc` (ROOT af projekt)
```
fund=false
audit=false
production=false
omit=dev
```

### 2. `nixpacks.toml` (ROOT af projekt)
```toml
[phases.setup]
nixPkgs = ["nodejs", "npm"]

[phases.install] 
cmds = [
  "npm ci --omit=dev --no-audit --no-fund"
]

[phases.build]
cmds = ["echo 'Build complete'"]

[phases.start]
cmd = "NODE_ENV=production node server.js"

[variables]
NODE_ENV = "production"
NPM_CONFIG_FUND = "false"
NPM_CONFIG_AUDIT = "false"
```

### 3. `railway.json` (ROOT af projekt)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "startCommand": "node server.js",
    "healthcheckPath": "/",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## Railway Environment Variables

Sæt disse i Railway dashboard under "Variables":

```bash
# Database
MYSQLHOST=${{MySQL.MYSQLHOST}}
MYSQLUSER=${{MySQL.MYSQLUSER}}
MYSQLPASSWORD=${{MySQL.MYSQLPASSWORD}}
MYSQLDATABASE=${{MySQL.MYSQLDATABASE}}

# App
NODE_ENV=production
NPM_CONFIG_FUND=false
NPM_CONFIG_AUDIT=false

# Port (auto-sat af Railway)
PORT=${{RAILWAY_PORT}}
```

## Deployment Steps

1. **Commit alle filer** til Git repository
2. **Push til GitHub**
3. **Railway auto-deployer** med nye konfigurationer
4. **Check deployment logs** for success
5. **Force redeploy** hvis nødvendigt

## Verification Commands

Test lokalt først:
```bash
# Install dependencies modern way
npm ci --omit=dev --no-audit --no-fund

# Start production mode
NODE_ENV=production node server.js
```

## Troubleshooting

Hvis warning fortsætter:

1. **Check Railway logs** - klik på deployment i dashboard
2. **Force redeploy** - gå til deployments og klik "Redeploy"  
3. **Verify filer** - tjek at alle config filer er committed
4. **Contact Railway** hvis problemet fortsætter

## Success Indicators

✅ Deployment completed without npm warnings  
✅ App accessible på Railway URL
✅ Database connection working
✅ No errors i Railway logs