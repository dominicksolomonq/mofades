# MO STYLES - Raspberry Pi Deployment Guide

## 📋 Backend Konfiguration

### Server Port
```
PORT=3001 (Standard)
```

### Admin Passwort
```
Passwort: admin
```
⚠️ **Wichtig**: Dieses Passwort sollte für die Produktion geändert werden!

### Webhook URL (Optional)
Erstelle eine `.env` Datei im `backend/` Ordner:
```bash
# backend/.env
WEBHOOK_URL=https://ihre-webhook-url.com
PORT=3001
```

---

## 🚀 Deployment auf Raspberry Pi

### 1. Voraussetzungen
```bash
# Node.js installieren (empfohlen: v18+)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 für Prozessmanagement
sudo npm install -g pm2
```

### 2. Projekt auf Raspberry Pi übertragen
```bash
# Gesamten Projektordner auf den Pi kopieren
scp -r "mo test 19.1" pi@raspberry-ip:/home/pi/
```

### 3. Backend starten
```bash
cd /home/pi/mo-test-19.1/backend

# Dependencies installieren
npm install

# TypeScript kompilieren
npm run build

# Mit PM2 starten (bleibt nach Neustart aktiv)
pm2 start dist/index.js --name "mo-styles-backend"
pm2 save
pm2 startup
```

### 4. Frontend bauen
```bash
cd /home/pi/mo-test-19.1

# Dependencies installieren
npm install

# Production Build erstellen
npm run build

# Static Files servieren (mit nginx)
sudo cp -r dist/* /var/www/html/

# Permissions für Uploads setzen!
# Das Backend muss in diesen Ordner schreiben können
sudo mkdir -p /var/www/html/uploads
sudo chown -R pi:pi /home/pi/mo-test-19.1/backend/uploads
# Oder Symlink erstellen, damit Nginx/Backend synchron sind:
sudo ln -s /home/pi/mo-test-19.1/backend/uploads /var/www/html/uploads
```

### 5. Nginx Konfiguration (WICHTIG!)
Damit API, Webhooks und Bilder-Uploads funktionieren, muss Nginx als Reverse-Proxy eingerichtet werden.

Bearbeite die Config: `sudo nano /etc/nginx/sites-available/default`

```nginx
server {
    listen 80;
    server_name _;

    root /var/www/html;
    index index.html;

    # Frontend (React Router Support)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API Proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploads Proxy (Bilder vom Backend servieren)
    location /uploads {
        proxy_pass http://localhost:3001;
    }
}
```
Danach Nginx neu starten: `sudo systemctl restart nginx`

### ⚠️ WICHTIG: Proxy Konfiguration

Für die lokale Entwicklung auf Windows wurde kurzzeitig ein Proxy in `vite.config.ts` genutzt. 
**Dieser wurde bereits entfernt**, damit der Production-Build auf dem Raspberry Pi reibungslos funktioniert.

Falls Sie jemals Verbindungsprobleme haben, stellen Sie sicher, dass `vite.config.ts` **KEINEN** Proxy-Block enthält:

```typescript
// ✅ KORREKT für Raspberry Pi / Production:
server: {
  port: 3000,
  host: '0.0.0.0',
},
```

---

## ⚙️ API Endpoints

| Methode | Endpoint                        | Beschreibung                    |
|---------|--------------------------------|--------------------------------|
| GET     | `/api/appointments`            | Alle Termine abrufen           |
| POST    | `/api/appointments/:id/book`   | Termin buchen                  |
| POST    | `/api/appointments/:id/toggle` | Termin-Status ändern (Admin)   |
| POST    | `/api/login`                   | Admin Login                    |
| POST    | `/api/analytics/pageview`      | Seitenaufruf tracken           |
| GET     | `/api/analytics`               | Analytics-Daten abrufen        |
| GET     | `/api/gallery`                 | Galerie-Bilder abrufen         |
| POST    | `/api/gallery/upload`          | Bild hochladen                 |
| POST    | `/api/gallery/:id/approve`     | Bild freigeben (Admin)         |
| DELETE  | `/api/gallery/:id`             | Bild löschen (Admin)           |

---

## 🔧 Wichtige Dateien

```
backend/
├── src/
│   └── index.ts          # Haupt-Server-Datei
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript-Konfiguration
└── .env                  # Umgebungsvariablen (erstellen!)

src/
├── App.tsx               # Haupt-React-Komponente
├── components/
│   ├── AdminCalendar.tsx # Admin Kalender
│   ├── AdminOverlay.tsx  # Admin Panel
│   ├── BookingOverlay.tsx # Buchungsformular
│   ├── Experience.tsx    # 3D Canvas
│   ├── OverlayUI.tsx     # Navigation
│   └── SceneModel.tsx    # 3D Logo Animation
└── types.ts              # TypeScript Typen
```

---

## 📱 Mobile Optimierungen (aktuell)

### Logo/Buttons
- **Mobile**: w-10 h-10 (Instagram), w-8 h-8 (Admin)
- **Tablet**: md:w-11 h-11, md:w-9 h-9
- **Desktop**: lg:w-12 h-12, lg:w-10 h-10

### 3D Animation (SceneModel.tsx)
```javascript
ANIMATION_CONFIG = {
    windup: {
        duration: 1.2,    // Sekunden
        rotation: -0.1,   // Radiant
    },
    fastspin: {
        duration: 3.5,    // Sekunden
        rotations: 1.0,   // Anzahl Umdrehungen
    },
    transition: {
        duration: 2.5,    // Sekunden
    }
};

// Idle Geschwindigkeit
idleSpeedRadPerSec = 0.6 * (Math.PI / 180) * 60; // ~0.628 rad/sec
```

---

## 🗓️ Termin-Generierung

Termine werden automatisch für die nächsten 7 Tage generiert:
- **Zeiten**: 13:00 - 19:00 Uhr (normaler Tag)
- **Zeiten**: 13:00 - 20:00 Uhr (So, Fr, Sa)
- **Status**: `free`, `booked`, `blocked`

---

## 📊 Datenspeicherung

⚠️ **Aktuell**: In-Memory (Daten gehen bei Neustart verloren!)

Für persistente Daten empfohlen:
- SQLite (einfach)
- PostgreSQL (robust)
- MongoDB (NoSQL)

---

*Erstellt am: 22.01.2026*
