# Schnellstart

## Voraussetzungen

- Python 3.13+ (empfohlen) oder Python 3.10+
- Node.js 16+ für TypeScript/Client-Build

## Installation

1. **Repository klonen**
   ```bash
   git clone https://github.com/lka/client_server_einkaufsliste.git
   cd client_server_einkaufsliste
   ```

2. **Virtuelle Umgebung erstellen und aktivieren**
   ```bash
   python -m venv venv

   # Windows
   venv\Scripts\activate

   # macOS/Linux
   source venv/bin/activate
   ```

3. **Python-Abhängigkeiten installieren**
   ```bash
   pip install -r requirements.txt
   ```

4. **Umgebungsvariablen konfigurieren**

   Kopiere `.env.example` zu `.env` und passe die Werte an:
   ```bash
   cp .env.example .env
   ```

   Wichtigste Einstellungen in `.env`:
   ```bash
   # JWT Secret - WICHTIG: Ändere dies in Produktion!
   SECRET_KEY=your-secret-key-here-change-in-production

   # Token Gültigkeit (in Minuten)
   ACCESS_TOKEN_EXPIRE_MINUTES=30

   # Administratorpasswort für ersten Setup
   ADMIN_PASSWORD=admin123

   # Datenbank-Konfiguration
   DATABASE_URL=sqlite:///./data.db

   # Shopping Day Configuration (Python convention: 0=Monday, 6=Sunday)
   MAIN_SHOPPING_DAY=2        # Wednesday (2)
   FRESH_PRODUCTS_DAY=4       # Friday (4)
   ```

5. **Client Build (TypeScript)**
   ```bash
   cd client
   npm install
   npm run build
   cd ..
   ```

6. **Server starten**
   ```bash
   # Entwicklungsserver (mit Auto-Reload)
   python -m uvicorn server.src.main:app --reload --port 8000

   # Oder Produktionsserver
   python server/src/app.py
   ```

7. **Anwendung öffnen**

   Öffne im Browser: `http://localhost:8000`

   **Erste Schritte:**
   - Login mit Admin-Credentials (Username: `admin`, Passwort aus `.env`)
   - Oder: Neuen Benutzer registrieren (muss von Admin genehmigt werden)

## Netzwerkzugriff (von anderen Geräten)

1. Notieren Sie die Network-URL, die beim Serverstart angezeigt wird (z.B. `http://192.168.1.100:8000`)
2. Öffnen Sie die Network-URL auf einem anderen Gerät im gleichen Netzwerk
3. Stellen Sie sicher, dass die Firewall den Port 8000 erlaubt (siehe DEVELOPER.md für Details)
