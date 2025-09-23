# Quick Fix: Railway NPM Warning

## Files to Add/Update

### 1. `.npmrc`
```
fund=false
audit=false  
production=false
omit=dev
```

### 2. `nixpacks.toml`
```toml
[phases.setup]
nixPkgs = ["nodejs", "npm"]

[phases.install]
cmds = ["npm ci --omit=dev --no-audit --no-fund"]

[phases.start] 
cmd = "NODE_ENV=production node server.js"

[variables]
NODE_ENV = "production"
NPM_CONFIG_FUND = "false"
NPM_CONFIG_AUDIT = "false"
```

## Railway Environment Variables

Set in Railway Dashboard:
```
NPM_CONFIG_FUND=false
NPM_CONFIG_AUDIT=false  
NODE_ENV=production
```

## Deploy Steps

1. Commit & push these files
2. Railway will auto-redeploy
3. Check logs for success

This should eliminate the npm warning completely!