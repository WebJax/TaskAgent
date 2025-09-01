# 🎯 TaskAgent - Opgave & Tidstyring

En simpel web-baseret opgave- og tidsstyring med support for kunder, projekter og opgaver. Perfekt til freelancere og små teams der har brug for at tracke tid på forskellige projekter.

## ✨ Features

- 👥 **Kunde administration** - Opret og administrer kunder
- 📁 **Projekt styring** - Organiser opgaver under projekter og kunder
- ⏱️ **Tidstagning** - Start/stop timer på opgaver med præcis tidsmåling
- 🔄 **Gentagne opgaver** - Support for daglige, ugentlige og månedlige opgaver
- 📊 **Oversigt** - Se tid brugt på hver opgave og projekt
- 💾 **MySQL database** - Persistent data storage

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

**Vigtigt:** Opdater database credentials i `db.js` hvis nødvendigt:
```javascript
const pool = mysql.createPool({
  host: '127.0.0.1',
  user: 'root',          // Din MySQL bruger
  password: '2010Thuva', // Dit MySQL password
  database: 'opgavestyring'
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
- Klik **▶️ Start** for at starte timer på en opgave
- Klik **⏹️ Stop** for at stoppe timeren
- Kun én opgave kan være aktiv ad gangen
- Timer stopper automatisk hvis browservindue lukkes eller skjules

### Gentagne opgaver
Vælg gentagelsesinterval når du opretter opgaver:
- **Daglig** - For opgaver der skal udføres hver dag
- **Ugentlig** - For ugentlige opgaver
- **Månedlig** - For månedlige opgaver

## 🏗️ Arkitektur

### Backend (Node.js + Fastify)
- `server.js` - API server med REST endpoints
- `db.js` - MySQL database connection
- `setup-database.js` - Database schema og test data

### Frontend (Vanilla JS)
- `public/index.html` - Main HTML interface
- `public/app.js` - Frontend JavaScript logic

### Database Schema
```sql
clients     - id, name, created_at, updated_at
projects    - id, name, client_id, created_at, updated_at
tasks       - id, title, project_id, repeat_interval, 
              time_spent, last_start, created_at, updated_at
```

## 🛠️ API Endpoints

### Kunder
- `GET /clients` - Hent alle kunder
- `POST /clients` - Opret ny kunde

### Projekter  
- `GET /projects` - Hent alle projekter (med kunde info)
- `POST /projects` - Opret nyt projekt

### Opgaver
- `GET /tasks` - Hent alle opgaver (med projekt og kunde info)
- `POST /tasks` - Opret ny opgave
- `POST /tasks/:id/start` - Start timer på opgave
- `POST /tasks/:id/stop` - Stop timer på opgave

## 📂 Projekt Struktur

```
taskagent/
├── package.json           # Dependencies og scripts
├── server.js             # API server
├── db.js                 # Database connection
├── setup-database.js     # Database setup
├── taskagent.js          # Original class (reference)
├── public/
│   ├── index.html        # Frontend interface
│   └── app.js           # Frontend JavaScript
└── README.md            # Denne fil
```

## 🔧 Udvid funktionalitet

### Tilføj nye features:
- Rapporter og statistikker
- Export til CSV/PDF
- Bruger authentication
- Email notifikationer
- Mobile app
- Integration med fakturering

### Tilpas design:
- Rediger CSS i `public/index.html`
- Tilføj nye komponenter i `public/app.js`

## 🐛 Fejlsøgning

### Database problemer
```bash
# Check MySQL status
brew services list | grep mysql

# Start MySQL hvis nødvendigt
brew services start mysql

# Test connection
mysql -u root -p
```

### Server problemer
- Check at port 3000 ikke er optaget
- Se server logs i terminalen
- Verificer database credentials i `db.js`

## 📝 Licens

MIT License - brug frit til personlige og kommercielle projekter.

---

**Lavet med ❤️ for effektiv tidstyring**
