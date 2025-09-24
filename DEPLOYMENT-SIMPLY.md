# TaskAgent - Simply.com Deployment Guide

## 🚨 Fejlfinding af 403 Forbidden Error

### 📋 Løsningsskridt:

#### 1. **Upload alle filer til ta.jaxweb.dk**
```
taskagent/
├── index.html              # ROOT fallback
├── test.php               # Diagnosticering  
├── .htaccess              # Hovedrouting
├── api/
│   ├── index.php          # API router
│   └── .htaccess          # API routing
├── config/
│   ├── database.php       # DB forbindelse
│   └── .htaccess          # Beskyttelse
├── public/                # Frontend filer
├── setup-database.php     # DB setup
```

#### 2. **Test sekvens på ta.jaxweb.dk:**

**A) Basis test:**
- Gå til: `http://ta.jaxweb.dk/test.php`
- Tjek PHP version, moduler og fil struktur

**B) Database test:**
- Kør: `http://ta.jaxweb.dk/setup-database.php`
- Verificer tabeller oprettes korrekt

**C) API test:**
- Test: `http://ta.jaxweb.dk/api/clients`
- Skulle returnere JSON med klienter

**D) Frontend test:**
- Åbn: `http://ta.jaxweb.dk/public/index.html`
- TaskAgent interface skulle være tilgængeligt

#### 3. **Mulige årsager til 403 fejl:**

**A) Filrettigheder:**
```bash
# Sæt korrekte rettigheder
chmod 644 *.php *.html
chmod 755 api/ config/ public/
chmod 644 .htaccess api/.htaccess config/.htaccess
```

**B) Manglende mod_rewrite:**
- Hvis rewrite ikke virker, tilgå direkte:
- `http://ta.jaxweb.dk/public/index.html`
- `http://ta.jaxweb.dk/api/index.php?/clients`

**C) Apache konfiguration:**
- Simply.com skal tillade .htaccess rewrite rules
- Kontakt support hvis nødvendigt

#### 4. **Alternative adgangsveje:**

**Hvis .htaccess ikke virker:**
1. Tilgå direkte: `http://ta.jaxweb.dk/public/index.html`
2. API calls skal ændres til: `/api/index.php?/endpoint`

#### 5. **Debug information:**

**Tjek test.php output for:**
- ✅ PHP Version (>=7.4)
- ✅ PDO MySQL extension
- ✅ File permissions
- ✅ Directory structure
- ✅ Database connection

### 📞 Support kontakt:

Hvis problemet fortsætter:
1. Send screenshot af `test.php` output
2. Kontakt Simply.com support om .htaccess/mod_rewrite
3. Spørg om PHP konfiguration

### 🔧 Manuelle fixes:

**Hvis rewrite ikke virker,** rediger `public/app.js`:
```javascript
// Ændre alle API calls fra:
fetch('/api/tasks')
// Til:
fetch('/api/index.php?/tasks')
```

---

**Test rækkefølge**: test.php → setup-database.php → api/clients → public/index.html