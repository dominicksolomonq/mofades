# Konversations-Kontext: Einrichtung MO STYLES auf Raspberry Pi

## Status Quo (Stand: 21.01.2026)

Das Projekt **MO STYLES** (Frontend: React/Vite, Backend: Node.js/Express) ist erfolgreich auf einem **Raspberry Pi 5** gehostet und unter einer öffentlichen Domain via **Cloudflare Tunnel** erreichbar.

### 1. System-Setup
-   **Host:** Raspberry Pi 5
-   **User:** `pidomi`
-   **Projektpfad (Source):** `/home/pidomi/mofades`
-   **Projektpfad (Public Web):** `/var/www/html` (Manuelle Kopie der Build-Dateien)
-   **Webserver:** Nginx (Proxy für Frontend und API)
-   **Tunnel:** Cloudflare Tunnel (`cloudflared`)
-   **Backend Manager:** PM2

### 2. Projekt-Struktur & Workflow
-   **Backup-Ordner (PC):** `C:\mo test 19.1` (veraltet/Backup)
-   **Arbeits-Ordner (PC):** `C:\Users\soloma\OneDrive - Autohaus Oppel GmbH\Desktop\mo test 19.1`
-   **Deployment-Workflow:**
    1.  Änderungen am PC machen.
    2.  `git push`
    3.  Auf dem Pi: `cd ~/mofades` -> `git pull` -> `npm run build`
    4.  Auf dem Pi: `sudo cp -r dist/* /var/www/html/` (Wichtig: "Holzhammer-Methode" für Rechteverwaltung)
    5.  Falls Backend geändert: `cd backend` -> `npm run build` -> `pm2 restart mo-backend`

### 3. Wichtige Konfigurationen

#### Nginx (`/etc/nginx/sites-available/mo-styles`)
```nginx
server {
    listen 80;
    server_name _;
    root /var/www/html;
    index index.html;
    location / { try_files $uri $uri/ /index.html; }
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Cloudflare Tunnel (`~/.cloudflared/config.yml`)
-   **Tunnel-ID:** `48b62ad1-198d-49b4-b432-bd0c263a9fbe`
-   **Mapping:** Leitet öffentliche Domain auf `http://localhost:80` (Nginx).

#### Code-Anpassungen
-   **Bilder:** Alle Bilder liegen in `public/` und heißen web-freundlich (z.B. `bild-1.png`).
-   **API-URL:** In `src/App.tsx` ist `API_URL` auf `''` (leer) gesetzt, damit relative Pfade (`/api/...`) genutzt werden. Das ermöglicht Zugriff von allen Geräten.

### 4. Bekannte Besonderheiten
-   **Analytics:** Daten liegen nur im RAM und werden bei Neustart des Backends (`pm2 restart`) gelöscht.
-   **Termin-Buchung:** Funktioniert geräteübergreifend dank leerer `API_URL`.
-   **3D-Model:** Liegt unter `/test123.glb` im `public` Ordner.

---
**Um diesen Kontext wiederherzustellen:**
Lies diese Datei und du weißt sofort, wo wir stehen.
