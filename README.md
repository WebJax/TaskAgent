````markdown
# TaskAgent - Professionel Opgave & Tidstyring

En avanceret web-baseret opgave- og tidsstyringssystem med fuld PWA support. Designet som en native-lignende applikation med moderne UI/UX og omfattende funktionalitet til freelancere og teams.

## Features

- **Kunde Administration** - Komplet CRUD for kunder med live editing
- **Projekt Styring** - Hierarkisk organisering af opgaver under projekter og kunder  
- **Avanceret Tidstagning** - Præcis start/stop timer med automatisk pause funktionalitet
- **Gentagende Opgaver** - Fleksible gentagelsesmønstre (daglig, ugentlig, månedlig, årlig) med individuel completion tracking
- **Opgave Flytning** - Flyt opgaver til andre datoer via intuitive date picker
- **Progressive Web App** - Installer som native app med offline support og notifications
- **Moderne UI** - Professionelle Lucide ikoner og responsive design
- **Intelligent Caching** - Avanceret cache management for optimal performance
- **Pause System** - Indbygget pause funktionalitet med countdown timer
- **Date Navigation** - Ugebaseret navigation med visual date selection
- **Service Worker** - Background sync og offline funktionalitet

## 🚀 Quick Start

### 1. Installation

```bash
# Clone eller download projektet
cd taskagent

# Installer dependencies
npm install
```

### 2. Database Setup

Sørg for at MySQL kører lokalt og opret databasen:

```bash
# Kør database setup (opretter database og tabeller)
npm run setup-db
```

**Database Setup Scripts:**
- `setup-database-clean.js` - Clean database setup
- `add-sample-data.js` - Test data for development
- Migration scripts for schema updates

**Database credentials i `db.js`:**
```javascript
const pool = mysql.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: '2010Thuva',
  database: 'opgavestyring',
  connectionLimit: 10
});
```

### 3. Start serveren

```bash
# Start serveren
npm start

# Eller med auto-reload under udvikling
npm run dev
```

Åbn http://localhost:3000 i din browser.

## 📖 Brug

### Opret data
1. **Kunder** - Start med at oprette en eller flere kunder
2. **Projekter** - Opret projekter og tildel dem til kunder (valgfrit)
3. **Opgaver** - Opret opgaver og tildel dem til projekter (valgfrit)

### Tidstagning
- Klik **Play ikon** for at starte timer på en opgave
- Klik **Square ikon** for at stoppe timeren  
- Kun én opgave kan være aktiv ad gangen
- Automatisk pause når browsertab skjules
- Pause funktion med konfigurerbar varighed

### Gentagende Opgaver
Avanceret gentagelsessystem med:
- **Daglig** - Med konfigurerbare intervaller (hver dag, hver 2. dag, etc.)
- **Ugentlig** - Ugentlige gentagelser med custom intervaller
- **Månedlig** - Månedlige opgaver med interval support
- **Årlig** - Årlige gentagelser
- **Individuel Completion** - Separate completion tracking per dato
- **Visning Logic** - Intelligente regler for hvornår opgaver vises

### Opgave Flytning
- Klik **Calendar ikon** ved en opgave
- Vælg ny dato via date picker
- Opgave flyttes til den valgte dato med bekræftelse

### PWA Funktionalitet
- **Installation** - Installer som native app på desktop og mobile
- **Offline Support** - Fungerer uden internetforbindelse
- **Background Sync** - Synkroniserer data når connection genoptages
- **Notifications** - Push beskeder for pause timer og påmindelser

## 🏗️ Arkitektur

### Backend (Node.js + Fastify)
- `server.js` - REST API server med CORS, caching headers og comprehensive endpoints
- `db.js` - MySQL connection pool med retry logic
- Database migration system med versionerede scripts

### Frontend (Progressive Web App)
- `public/index.html` - Responsive HTML interface med Lucide ikoner
- `public/app.js` - Advanced JavaScript TaskAgent class med PWA support
- `public/manifest.json` - PWA manifest med app shortcuts
- `public/sw.js` - Service Worker med caching strategies
- `public/icons/` - Complete icon set (16px til 512px) plus SVG source

### Database Schema (MySQL)
```sql
-- Core Tables
clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  client_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
);

tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  project_id INT,
  completed BOOLEAN DEFAULT FALSE,
  time_spent INT DEFAULT 0,
  last_start TIMESTAMP NULL,
  
  -- Recurring task fields
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_type ENUM('daily', 'weekly', 'monthly', 'yearly'),
  recurrence_interval INT DEFAULT 1,
  start_date DATE,
  next_occurrence TIMESTAMP NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

-- Recurring task completion tracking
recurring_task_completions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  completion_date DATE NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_task_date (task_id, completion_date),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);
```

## 🛠️ API Endpoints

### Kunder
- `GET /clients` - Hent alle kunder (med cache headers)
- `POST /clients` - Opret ny kunde
- `PUT /clients/:id` - Opdater kunde
- `DELETE /clients/:id` - Slet kunde

### Projekter  
- `GET /projects` - Hent alle projekter med kunde relationer
- `POST /projects` - Opret nyt projekt
- `PUT /projects/:id` - Opdater projekt
- `DELETE /projects/:id` - Slet projekt

### Opgaver
- `GET /tasks` - Hent alle opgaver med projekt/kunde joins
- `POST /tasks` - Opret ny opgave (support for recurring)
- `PUT /tasks/:id` - Opdater opgave
- `PUT /tasks/:id/move` - Flyt opgave til ny dato
- `DELETE /tasks/:id` - Slet opgave
- `POST /tasks/:id/start` - Start timer med session tracking
- `POST /tasks/:id/stop` - Stop timer med time accumulation

### Gentagende Opgaver
- `GET /recurring-completions` - Hent alle completion records
- `POST /tasks/:id/complete-recurring` - Marker gentagende opgave færdig for dato
- `POST /tasks/:id/uncomplete-recurring` - Fjern completion for dato

### PWA Support
- `GET /manifest.json` - App manifest for installation
- Service Worker caching for offline support
- Background sync endpoints for data synchronization

## 📂 Projekt Struktur

```
taskagent/
├── package.json                    # Dependencies, scripts og metadata
├── server.js                      # Fastify API server med comprehensive endpoints
├── db.js                          # MySQL connection pool configuration
├── start.sh                       # Production startup script
├── server.log                     # Server runtime logs
│
├── Database Setup & Migration/
├── setup-database-clean.js        # Clean database initialization
├── setup-database.js              # Database med sample data
├── add-sample-data.js             # Test data insertion
├── migrate-add-completed.js       # Completion field migration
├── migrate-add-start-date.js      # Start date field for recurring tasks
├── add-recurring-columns.js       # Recurring task columns
├── add-recurring-completions.js   # Completion tracking table
│
├── PWA & Frontend/
├── public/
│   ├── index.html                 # Responsive HTML med Lucide ikoner
│   ├── app.js                     # Advanced TaskAgent class med PWA support
│   ├── manifest.json              # PWA manifest med app shortcuts
│   ├── sw.js                      # Service Worker med caching strategies
│   ├── reports.html               # Reporting interface (separate view)
│   ├── reports.js                 # Reporting functionality
│   ├── icon-generator.html        # SVG til PNG icon generator
│   └── icons/
│       ├── icon.svg               # Master SVG icon (TaskAgent branding)
│       ├── icon-16x16.png         # Favicon
│       ├── icon-32x32.png         # Small icon
│       ├── icon-72x72.png         # Mobile icon
│       ├── icon-96x96.png         # Mobile icon
│       ├── icon-128x128.png       # Desktop icon
│       ├── icon-144x144.png       # Mobile icon (high-res)
│       ├── icon-152x152.png       # iOS icon
│       ├── icon-192x192.png       # Android icon
│       ├── icon-384x384.png       # Large icon
│       └── icon-512x512.png       # Splash screen icon
│
├── Documentation/
├── README.md                      # Comprehensive documentation
└── .github/
    └── copilot-instructions.md    # AI coding agent guidelines
```

## 🔧 Udvid funktionalitet

### Arkitektur Features:
- **Modulær Frontend** - Single-class TaskAgent pattern med clear separation
- **Event Delegation** - Robust event handling med `closest()` for dynamiske elementer  
- **Cache Management** - Timestamp-baserede query parameters og cache-busting headers
- **State Synchronization** - Client-side state management med server data consistency
- **Responsive Design** - Mobile-first approach med desktop optimizations
- **Icon System** - Scalable Lucide Icons med pointer-events management

### Extension Points:
- **Custom Views** - Tilføj nye views via menu system i `app.js`
- **Additional APIs** - Extend server endpoints i `server.js` 
- **PWA Features** - Enhance service worker caching strategies
- **Database Migrations** - Add schema changes via migration scripts
- **Custom Reports** - Extend `reports.js` med nye visualiseringer
- **Notification System** - Expand push notification capabilities

### Development Patterns:
- **Database Migrations** - Incremental schema changes med descriptive filenames
- **API Consistency** - Standardized JSON responses og error handling
- **Frontend State** - Manual DOM manipulation med automatic icon initialization
- **Cache Strategy** - Aggressive development no-cache, production-ready caching

## 🐛 Fejlsøgning

### Database Issues
```bash
# Check MySQL status
brew services list | grep mysql
# or
sudo systemctl status mysql

# Start MySQL
brew services start mysql
# or 
sudo systemctl start mysql

# Test connection til opgavestyring database
mysql -u root -p opgavestyring -e "SHOW TABLES;"

# Verify data
mysql -u root -p opgavestyring -e "SELECT COUNT(*) FROM tasks;"
```

### Server Issues
```bash
# Check port availability
lsof -ti:3000

# Kill processes on port 3000
lsof -ti:3000 | xargs kill -9

# Start med debug output
node server.js

# Check logs
tail -f server.log
```

### Cache Issues
- **Browser Cache** - Use Cmd+Shift+R (Mac) eller Ctrl+Shift+R (Windows)
- **Developer Tools** - Disable cache i Network tab
- **Service Worker** - Clear SW cache i Application tab
- **API Responses** - Verify cache-control headers i Network tab

### PWA Installation Issues
- **HTTPS Requirement** - PWA kræver HTTPS (undtagen localhost)
- **Manifest Errors** - Check console for manifest parsing issues
- **Service Worker** - Ensure SW registers without errors
- **Installation Prompt** - May require user gesture og specific criteria

## Technical Specifications

### Performance
- **Client-side** - Vanilla JavaScript, no framework dependencies
- **Server-side** - Node.js med Fastify for optimal performance  
- **Database** - MySQL med connection pooling og optimized queries
- **Caching** - Multi-level caching strategy (browser, service worker, API)
- **Icons** - Lightweight Lucide icon system med SVG optimization

### Browser Compatibility
- **Modern Browsers** - Chrome, Firefox, Safari, Edge (ES6+ support)
- **PWA Support** - Full installation support on supported platforms
- **Responsive** - Works on desktop, tablet og mobile devices
- **Offline** - Core functionality available offline via Service Worker

### Security Considerations  
- **SQL Injection** - Parameterized queries throughout
- **CORS** - Configured for local development
- **Input Validation** - Server-side validation på alle endpoints
- **XSS Prevention** - Proper output encoding og CSP headers

## Production Deployment

### Environment Setup
```bash
# Production database setup
mysql -u root -p < setup-database-clean.js

# Environment variables
NODE_ENV=production
DB_HOST=your-mysql-host
DB_USER=your-mysql-user  
DB_PASS=your-mysql-password
DB_NAME=opgavestyring

# Start med process manager
pm2 start server.js --name taskagent
```

### HTTPS & SSL
TaskAgent PWA requires HTTPS for full functionality i production:
- SSL certificate installation
- Service Worker registration requires secure context
- Push notifications require HTTPS

## Licens

MIT License - brug frit til personlige og kommercielle projekter.

---

**Modern opgavestyring med professionel arkitektur og PWA capabilities**
