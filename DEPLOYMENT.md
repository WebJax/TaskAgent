# 🚀 TaskAgent Deployment Guide

## 📋 Oversigt

TaskAgent kan køre både i lokal udvikling (Herd/Nginx) og på produktion (Simply.com/Apache). Denne guide beskriver forskellen mellem de to miljøer.

---

## 🏠 Lokal Udvikling (Herd/Nginx)

### Miljø
- **Server**: Nginx via Laravel Herd
- **URL**: https://taskagent.test
- **Database**: Lokal MySQL (localhost)
- **Credentials**: root / 2010Thuva

### Filstruktur
```
taskagent/
├── public/              # Document root (server root)
│   ├── .htaccess       # Bruges kun hvis Apache fallback
│   ├── index.html      # Main app
│   ├── index.php       # PHP router (ikke nødvendig med Nginx)
│   ├── app.js          # Application logic
│   ├── reports.html
│   └── icons/
├── api/
│   └── index.php       # API endpoint
└── config/
    └── database.php    # Auto-detekterer miljø
```

### .htaccess (Development)
Filen `/public/.htaccess` bruges kun hvis du kører Apache i stedet for Nginx.
- Simpel routing til `/api/` 
- No-cache headers
- SPA fallback til `index.html`

### Nginx Konfiguration
Herd håndterer automatisk Nginx config, men grundlæggende setup er:
```nginx
location /api/ {
    try_files $uri $uri/ /api/index.php?$query_string;
}

location / {
    try_files $uri $uri/ /index.html;
}
```

---

## 🌐 Produktion (Simply.com/Apache)

### Miljø
- **Server**: Apache på Simply.com
- **URL**: https://taskagent.jaxweb.dk
- **Database**: MySQL på mysql58.unoeuro.com
- **Credentials**: (se config/database.php)

### Filstruktur på Server
Upload ALLE filer til webhotel root:
```
public_html/             # Server root
├── .htaccess           # VIGTIG! Omdøb .htaccess.production til .htaccess
├── public/             # App filer
│   ├── index.html
│   ├── app.js
│   └── icons/
├── api/
│   └── index.php
└── config/
    └── database.php
```

### .htaccess (Production)
Filen `/.htaccess.production` skal omdøbes til `/.htaccess` ved upload:

**Vigtige forskelle fra development:**
1. **RewriteBase /** - Kører fra server root
2. **API routing** - Redirecter `/api/*` til `api/index.php`
3. **Public folder routing** - Server filer fra `public/` mappen
4. **SPA fallback** - Alle routes går til `public/index.html`
5. **Cache headers** - Enabler caching for bedre performance
6. **Security headers** - CORS, XSS protection, etc.
7. **Compression** - Gzip/deflate for mindre filer

---

## 🔄 Deployment Process

### 1. Upload Filer via FTP/SFTP
```bash
# Via FTP client (Transmit, FileZilla, Cyberduck)
# Upload alt til public_html/ eller tilsvarende
```

### 2. Omdøb .htaccess
```bash
# På serveren:
mv .htaccess.production .htaccess
```

### 3. Check Database Konfiguration
`config/database.php` detekterer automatisk miljø baseret på hostname:
- Hvis `jaxweb.dk` eller `unoeuro.com` → Production credentials
- Ellers → Development credentials

### 4. Setup Database (Første gang)
Besøg: `https://taskagent.jaxweb.dk/setup-database.php`

### 5. Test API
Besøg: `https://taskagent.jaxweb.dk/api/clients`
Skal returnere JSON: `{"success":true,"data":[...]}`

### 6. Test App
Besøg: `https://taskagent.jaxweb.dk/`
Skal vise TaskAgent interface

---

## 🔍 Fejlfinding

### 403 Forbidden
**Årsag**: Forkert `.htaccess` eller manglende `DirectoryIndex`

**Løsning**:
1. Check at `.htaccess` findes i server root
2. Check at den indeholder `DirectoryIndex index.html index.php`
3. Check file permissions (644 for filer, 755 for mapper)

### 500 Internal Server Error
**Årsag**: Syntax fejl i `.htaccess` eller PHP fejl

**Løsning**:
1. Check Apache error log via Simply.com kontrolpanel
2. Tjek at alle `<IfModule>` tags er lukket korrekt
3. Test med minimal `.htaccess` og tilføj gradvist

### API returnerer 404
**Årsag**: API routing virker ikke

**Løsning**:
1. Check at `RewriteRule ^api/(.*)$ api/index.php [L,QSA]` findes i `.htaccess`
2. Check at `api/index.php` er uploadet
3. Check at mod_rewrite er aktiveret på serveren

### Database Connection Failed
**Årsag**: Forkerte credentials eller server down

**Løsning**:
1. Check database credentials i Simply.com kontrolpanel
2. Opdater `config/database.php` med korrekte værdier
3. Test forbindelse via phpMyAdmin

### CSS/JS loader ikke
**Årsag**: Forkerte MIME types eller path

**Løsning**:
1. Check at `.htaccess` indeholder MIME type declarations
2. Verificer at filer er i `public/` mappen
3. Check browser console for 404 eller MIME errors

---

## ⚙️ Forskelle mellem Miljøer

| Feature | Development (Herd) | Production (Simply) |
|---------|-------------------|---------------------|
| Server | Nginx | Apache |
| .htaccess | Simpel/ikke brugt | Omfattende |
| Routing | Nginx config | mod_rewrite |
| Cache | Disabled | Enabled |
| Compression | N/A | Gzip/Deflate |
| Security Headers | Basic | Full suite |
| Database | localhost | mysql58.unoeuro.com |
| URL | taskagent.test | taskagent.jaxweb.dk |

---

## 📝 Checklist ved Deployment

- [ ] Upload alle filer til server
- [ ] Omdøb `.htaccess.production` til `.htaccess` i root
- [ ] Check at `public/` mappen er uploaded komplet
- [ ] Check at `api/index.php` er uploaded
- [ ] Check at `config/database.php` er uploaded
- [ ] Besøg `/setup-database.php` (første gang)
- [ ] Test `/api/clients` endpoint
- [ ] Test app på `/`
- [ ] Check at timer funktioner virker
- [ ] Check at create/edit/delete virker
- [ ] Test på mobil browser
- [ ] Slet `setup-database.php` efter første setup

---

## 🔐 Sikkerhed

### Production Sikkerhed
1. **.htaccess** beskytter `.env`, `.git`, `node_modules`
2. **Security headers** forhindrer XSS, clickjacking, MIME sniffing
3. **CORS** kun enabled for API endpoints
4. **Directory listing** disabled

### Anbefalinger
1. Brug HTTPS (aktiveret via Simply.com kontrolpanel)
2. Opdater database passwords regelmæssigt
3. Hold backup af database
4. Begræns database user permissions (kun nødvendige tabeller)

---

## 📞 Support

Hvis du oplever problemer:
1. Check denne guide først
2. Se Simply.com's dokumentation for Apache/PHP
3. Check error logs via kontrolpanel
4. Kontakt Simply.com support hvis server-relateret

---

**Sidste opdatering**: 10. oktober 2025
