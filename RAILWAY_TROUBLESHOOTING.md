# Railway Deployment Troubleshooting

## Problem: npm warn config production

**Error Message:**
```
npm warn config production Use `--omit=dev` instead.
```

**Solution:**
De følgende filer er tilføjet for at fixe dette problem:

### 1. `.npmrc`
```
fund=false
audit=false  
omit=dev
```

### 2. `nixpacks.toml` 
```toml
[phases.build]
cmds = ["npm ci --omit=dev"]

[phases.start]
cmd = "NODE_ENV=production node server.js"
```

### 3. `package.json` (opdateret)
```json
{
  "scripts": {
    "start": "node server.js",
    "build": "npm install --omit=dev"
  }
}
```

### 4. `railway.json` (opdateret)
```json
{
  "build": {
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "NODE_ENV=production npm start"
  }
}
```

## Deployment Steps

1. **Push kode til GitHub** med de nye filer
2. **Railway auto-deploy** vil bruge de nye konfigurationer
3. **Hvis fejl persisterer**, force redeploy i Railway dashboard
4. **Check logs** i Railway for eventuelle andre fejl

## Verifikation

For at teste lokalt at production mode virker:
```bash
NODE_ENV=production npm start
```

Dette skal starte serveren uden warnings eller fejl.

## Alternativ Løsning

Hvis problemet fortsætter, kan du også:

1. **Disable automatiske warnings** i Railway environment variables:
   ```
   NPM_CONFIG_FUND=false
   NPM_CONFIG_AUDIT=false  
   ```

2. **Brug Railway CLI** til manual deployment:
   ```bash
   railway login
   railway link [PROJECT_ID]
   railway up
   ```