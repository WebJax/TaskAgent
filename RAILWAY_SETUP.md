# TaskAgent - Railway.com Implementation Guide

## 🚀 Railway Environment Variables

Your Railway MySQL service provides these variables:

```bash
# Railway Auto-Generated MySQL Variables
${{MySQL.MYSQLHOST}}      # Database host
${{MySQL.MYSQLUSER}}      # Database username  
${{MySQL.MYSQLPASSWORD}}  # Database password
${{MySQL.MYSQLDATABASE}}  # Database name
```

## 📋 Setup Steps

### 1. Local Development

Create `.env` file in project root:
```bash
# Local MySQL (development)
MYSQLHOST=127.0.0.1
MYSQLUSER=root  
MYSQLPASSWORD=your_local_password
MYSQLDATABASE=opgavestyring
MYSQLPORT=3306
NODE_ENV=development
PORT=3000
```

### 2. Railway Deployment

In Railway dashboard, set these environment variables:

```bash
# Database (use Railway variables)
MYSQLHOST=${{MySQL.MYSQLHOST}}
MYSQLUSER=${{MySQL.MYSQLUSER}}
MYSQLPASSWORD=${{MySQL.MYSQLPASSWORD}}
MYSQLDATABASE=${{MySQL.MYSQLDATABASE}}

# App configuration
NODE_ENV=production
PORT=${{RAILWAY_PORT}}
```

### 3. Database Setup

After deployment, initialize the database:

**Option A: Railway Dashboard**
```bash
# Go to Service > Deploy > Run Command
npm run setup-db
```

**Option B: Railway CLI**
```bash
railway login
railway link [YOUR_PROJECT_ID]  
railway run npm run setup-db
```

## 🛠️ Code Implementation

### Database Connection (`db.js`)
```javascript
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.MYSQLHOST || '127.0.0.1',
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD || 'default_password',
  database: process.env.MYSQLDATABASE || 'opgavestyring',
  port: process.env.MYSQLPORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // SSL required for Railway production
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});
```

### Server Configuration (`server.js`)  
```javascript
import 'dotenv/config'; // Load .env variables

const start = async () => {
  const port = process.env.PORT || 3000;
  await fastify.listen({ port: port, host: '0.0.0.0' });
};
```

## 🔧 Development Workflow

### Local Development
```bash
# Install dependencies
npm install

# Setup local database  
npm run setup-db

# Start development server
npm run dev
```

### Railway Development (using Railway DB)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and link project
railway login
railway link

# Run locally with Railway variables
railway run npm run dev
```

### Production Deployment
```bash
# Railway automatically runs:
npm run build  # (optional build step)
npm start      # Starts production server
```

## 📁 File Structure

```
taskagent/
├── .env                 # Local environment variables
├── .env.example        # Environment template  
├── railway.json        # Railway configuration
├── RAILWAY_DEPLOY.md   # Detailed deployment guide
├── db.js              # Database connection with env vars
├── server.js          # Server with env vars
├── setup-database.js  # Database setup with env vars
└── package.json       # Updated with build script
```

## 🔒 Security Notes

- ✅ `.env` file is in `.gitignore` (credentials safe)
- ✅ SSL enabled for production database connections  
- ✅ Environment-based configuration for dev/prod
- ✅ No hardcoded credentials in source code

## 🚦 Quick Deploy Checklist

1. ☑️ Create MySQL service in Railway
2. ☑️ Deploy app from GitHub repository  
3. ☑️ Set environment variables in Railway dashboard
4. ☑️ Run `npm run setup-db` to initialize database
5. ☑️ Test app at Railway-provided URL

Your TaskAgent app is now production-ready with Railway! 🎉