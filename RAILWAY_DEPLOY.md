# Railway.com Deployment Guide

## 1. Railway Setup

### Database Setup
1. **Opret MySQL service** i Railway dashboard
2. **Kopiér environment variabler** fra MySQL service:
   - `${{MySQL.MYSQLHOST}}`
   - `${{MySQL.MYSQLUSER}}`  
   - `${{MySQL.MYSQLPASSWORD}}`
   - `${{MySQL.MYSQLDATABASE}}`

### App Setup  
1. **Deploy TaskAgent** fra GitHub repository
2. **Sæt environment variabler** i Railway dashboard:

```bash
# Database (auto-generated fra MySQL service)
MYSQLHOST=${{MySQL.MYSQLHOST}}
MYSQLUSER=${{MySQL.MYSQLUSER}}
MYSQLPASSWORD=${{MySQL.MYSQLPASSWORD}}
MYSQLDATABASE=${{MySQL.MYSQLDATABASE}}

# App configuration
NODE_ENV=production
PORT=${{RAILWAY_PORT}}
```

## 2. Database Migration

Efter deployment, kør database setup:

```bash
# I Railway dashboard > Service > Deploy logs
npm run setup-db
```

Eller via Railway CLI:
```bash
railway run npm run setup-db
```

## 3. Local Development

For lokal udvikling med Railway database:

1. **Installer Railway CLI:**
```bash
npm install -g @railway/cli
```

2. **Login og link projekt:**
```bash
railway login
railway link [PROJECT_ID]
```

3. **Kør lokalt med Railway variabler:**
```bash
railway run npm run dev
```

Eller opret `.env` fil med Railway variabler:
```bash
railway variables --json > .env.railway
# Så kopier værdierne til din .env fil
```

## 4. Environment Variabler Reference

### Railway Auto-Generated
- `${{MySQL.MYSQLHOST}}` → Database host URL
- `${{MySQL.MYSQLUSER}}` → Database username  
- `${{MySQL.MYSQLPASSWORD}}` → Database password
- `${{MySQL.MYSQLDATABASE}}` → Database name
- `${{RAILWAY_PORT}}` → Auto-assigned port

### Custom App Variables
```
NODE_ENV=production
MYSQLPORT=3306  # (railway bruger standard port)
```

## 5. SSL Configuration

Railway MySQL kræver SSL i produktion - dette er allerede konfigureret i `db.js`:

```javascript
ssl: process.env.NODE_ENV === 'production' ? {
  rejectUnauthorized: false
} : false
```

## 6. Deployment Commands

```json
{
  "scripts": {
    "start": "NODE_ENV=production node server.js",
    "build": "echo 'No build step required'",
    "setup-db": "node setup-database.js"
  }
}
```

Railway vil automatisk køre `npm start` efter deployment.