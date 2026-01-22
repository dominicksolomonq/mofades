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

# Static Files servieren (z.B. mit nginx)
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
