# TaskAgent PHP Setup Guide

## 🔧 Konvertering fra Node.js til PHP

TaskAgent er nu konverteret fra Node.js/Fastify til PHP med MySQL database på Uno Euro hosting.

### 📋 Systemkrav

- **Lokal udvikling**: Laravel Herd (nginx + PHP)
- **Database**: MySQL på mysql58.unoeuro.com  
- **Web server**: Apache 2.4 (remote) eller nginx (lokal med Herd)

### 🗂️ Projektstruktur

```
taskagent/
├── config/
│   └── database.php          # Database forbindelse og hjælpe-funktioner
├── api/
│   ├── index.php            # Hovedrouter til alle API endpoints
│   └── .htaccess           # API routing regler
├── public/
│   ├── index.html          # Frontend applikation
│   ├── app.js              # TaskAgent hovedklasse (uændret)
│   ├── reports.html        # Rapporter side
│   └── reports.js          # Rapport funktionalitet (uændret)
├── .htaccess               # Root routing og CORS headers
├── setup-database.php      # Database initialisering
└── README-PHP.md           # Dette dokument
```

### 🗄️ Database Konfiguration

**Remote Database (Uno Euro):**
- Host: `mysql58.unoeuro.com`
- User: `jaxweb_dk` 
- Password: `zh9ktrcp`
- Database: `jaxweb_dk_db`
- Port: `3306`

### 🚀 Installation

#### 1. Database Setup
```bash
# Opret tabeller og test data
php setup-database.php
```

#### 2. Lokal udvikling med Herd
```bash
# Sørg for at projektet er i din Herd mappe
# Åbn http://taskagent.test i browseren
```

### 🌐 API Endpoints

Alle API endpoints er bevaret fra Node.js versionen:

#### Tasks
- `GET /tasks` - Hent alle opgaver
- `POST /tasks` - Opret ny opgave  
- `PUT /tasks/:id` - Opdater opgave
- `DELETE /tasks/:id` - Slet opgave
- `PUT /tasks/:id/move` - Flyt opgave til ny dato
- `POST /tasks/:id/start` - Start timer
- `POST /tasks/:id/stop` - Stop timer
- `POST /tasks/:id/complete` - Marker som fuldført
- `POST /tasks/:id/uncomplete` - Genåbn opgave

#### Recurring Tasks
- `POST /tasks/:id/complete-recurring` - Fuldfør gentagende opgave for dato
- `POST /tasks/:id/uncomplete-recurring` - Fjern fuldførelse for dato
- `POST /tasks/:id/start-recurring` - Start timer for gentagende opgave
- `POST /tasks/:id/stop-recurring` - Stop timer for gentagende opgave
- `GET /recurring-completions` - Hent alle fuldførelser

#### Clients & Projects  
- `GET /clients` - Hent kunder
- `POST /clients` - Opret kunde
- `PUT /clients/:id` - Opdater kunde
- `DELETE /clients/:id` - Slet kunde
- `GET /projects` - Hent projekter  
- `POST /projects` - Opret projekt
- `PUT /projects/:id` - Opdater projekt
- `DELETE /projects/:id` - Slet projekt

#### Reports
- `GET /reports/time` - Tidsrapport
- `GET /reports/projects` - Projekt statistikker  
- `GET /reports/clients` - Kunde statistikker
- `GET /reports/productivity` - Produktivitets dashboard

### 🔄 Routing System

#### .htaccess (root)
- Dirigerer `/api/*` til `api/index.php`
- Serverer statiske filer fra `public/`
- Håndterer SPA routing til frontend

#### api/.htaccess  
- Dirigerer alle requests til `api/index.php`
- Bevarer query parameters og HTTP metoder

### 🗃️ Database Schema

#### Hovedtabeller
```sql
clients (id, name, created_at, updated_at)
projects (id, name, client_id, created_at, updated_at) 
tasks (id, title, project_id, estimated_hours, time_spent, 
       last_start, completed, completed_at, is_recurring, 
       recurrence_type, recurrence_interval, next_occurrence,
       start_date, created_at, updated_at)
recurring_task_completions (id, task_id, completion_date, 
                           completed_at, time_spent, last_start)
```

### 🔍 Fejlfinding

#### Database forbindelse
```bash
# Test database forbindelse
php -r "require 'config/database.php'; echo 'DB OK';"
```

#### API test
```bash
# Test API endpoints  
curl http://taskagent.test/api/tasks
curl http://taskagent.test/api/clients
```

#### Logs
- PHP errors: Se web server error logs
- Database errors: Logges til error_log()

### 🎯 Forskelle fra Node.js version

#### ✅ Bevarede funktioner
- Alle API endpoints identiske
- Frontend JavaScript uændret
- Gentagende opgaver fuld funktionalitet  
- Timer system komplet
- Rapport system komplet

#### 🔄 Ændrede implementeringer
- **Database**: mysql2/promise → PDO
- **Server**: Fastify → PHP/Apache  
- **Routing**: Fastify router → .htaccess + PHP
- **Environment**: dotenv → Hardkoded credentials
- **Error handling**: JavaScript catch → PHP try/catch

### 📚 Udviklingsguide

#### Tilføj nyt endpoint
1. Tilføj route case i `api/index.php`
2. Implementer handler function  
3. Test med curl eller frontend

#### Database ændringer
1. Opdater `setup-database.php`
2. Kør setup igen: `php setup-database.php`

#### Frontend ændringer  
- Frontend JavaScript kræver ingen ændringer
- API calls bruger samme relative URLs

### 🔐 Sikkerhed

- PDO prepared statements mod SQL injection
- Input validering på alle endpoints
- CORS headers konfigureret
- Blokeret adgang til config-filer

### 🎯 Performance

- Database connection pooling via PDO
- Gzip compression (server-afhængig)  
- Static file caching via .htaccess
- Query optimering med indexes

---

**Status**: ✅ Fuldt funktionsdygtig PHP konvertering af TaskAgent
**Database**: ✅ Opsat på mysql58.unoeuro.com 
**Frontend**: ✅ Kompatibel uden ændringer
**API**: ✅ Alle endpoints implementeret