# Client/Server Einkaufsliste

Python FastAPI Server + TypeScript Client mit JWT-Authentifizierung und umfassender Testabdeckung.

Eine moderne Shopping-List-Anwendung mit sicherer Benutzerauthentifizierung, persistenter Datenspeicherung, **Mengenangaben** und vollständig getesteter API.

## Features

- ✅ **JWT-Authentifizierung**: Sichere Benutzerauthentifizierung mit automatischem Token-Refresh
- ✅ **Multi-Store-Management**: Organisation nach Geschäften und Abteilungen
  - 3 vorkonfigurierte Geschäfte: Rewe, Edeka, Kaufland
  - Je 9 Abteilungen pro Geschäft (z.B. "Obst & Gemüse", "Backwaren", "Milchprodukte")
  - Produktkatalog mit über 17 gängigen Produkten
  - Zuordnung von Produkten zu Geschäften und Abteilungen
  - **Automatische Produkt-Zuordnung**: Neue Items werden automatisch mit Produkten im Katalog gematcht (Fuzzy-Matching mit 60% Schwellwert)
  - **Abteilungs-Gruppierung**: Shopping-Liste zeigt Items gruppiert nach Abteilungen in Spalten-Layout
  - **Erstes Geschäft als Standard**: Automatische Auswahl des ersten Geschäfts beim Laden
  - **Items vor Datum löschen**: Alle Items mit Einkaufsdatum vor einem gewählten Datum löschen
    - DatePicker zur Datumsauswahl
    - Optional gefiltert nach ausgewähltem Geschäft
    - Mit Sicherheitsabfrage und Vorschau der betroffenen Items
  - **Produktkatalog erweitern**: Items aus "Sonstiges" per ✏️-Icon einer Abteilung zuweisen
    - Erstellt automatisch ein Produkt im Katalog (ohne Mengenangaben)
    - Item erscheint danach in der gewählten Abteilung statt in "Sonstiges"
    - Nutzt vorhandene Produkte, falls gleichnamiges Produkt bereits existiert
  - **Intelligente Druckfunktion**: Einkaufsliste als DIN A5-Heft drucken
    - Druckt auf DIN A4 Querformat → in der Mitte falten ergibt A5-Heft
    - **2-spaltige Darstellung**: Items werden in 2 Spalten angeordnet für optimale Platznutzung
    - Automatische Layout-Optimierung: Bei vielen Einträgen (>35 Zeilen) wird die Liste auf Vorder- und Rückseite verteilt
    - Bei wenigen Einträgen: Rückseite zeigt Notizen-Bereich mit Linien
    - **Scrollbare Print-Preview**: Überschrift und Buttons bleiben fixiert, Vorschaubereich ist scrollbar
    - Print-Preview zeigt beide Seiten nebeneinander mit gestrichelter Falzlinie
    - **Kompakter Header**: Geschäftsname und Datum in einer Zeile (ohne "Einkaufsliste -" Präfix)
    - Option zum Ausblenden der Abteilungsüberschriften (Live-Vorschau)
    - Optimierte Schriftgrößen und Abstände für kompakten Druck
    - Keine Aufzählungspunkte, reduzierte Zeilenabstände
    - Abteilungssektionen werden nicht zwischen Spalten aufgeteilt
  - **Geteilte Einkaufsliste**: Alle authentifizierten Benutzer teilen sich eine gemeinsame Einkaufsliste
    - Keine Benutzer-spezifischen Items mehr - alle Items gehören zur gemeinsamen Liste
    - Jeder kann Items hinzufügen, bearbeiten und löschen
    - Items werden mit `user_id=None` erstellt (gehören nicht zu einem spezifischen Benutzer)
    - Ideal für Haushalts-Einkaufslisten, bei denen alle Familienmitglieder die gleiche Liste sehen und bearbeiten
- ✅ **Store-Verwaltung**: Dedizierte Admin-Seite für Geschäfte und Abteilungen
  - **CRUD-Operationen**: Erstellen, Bearbeiten und Löschen von Stores und Departments
  - **Geschäfts-Sortierung**: Reihenfolge der Geschäfte mit ↑↓ Buttons ändern
    - Bestimmt die Reihenfolge im Store-Auswahlmenü
    - Persistiert in der Datenbank (sort_order Feld)
  - **Abteilungs-Sortierung**: Reihenfolge der Abteilungen mit ↑↓ Buttons ändern
    - Die Abteilungsreihenfolge wird automatisch in der Shopping-Liste übernommen
    - Produkte werden nach Abteilungsreihenfolge gruppiert angezeigt
  - **Cascading Deletes**: Beim Löschen eines Stores werden automatisch alle zugehörigen Departments und Products entfernt
  - **Visuelle Organisation**: Übersichtliche Darstellung der Store-Department-Hierarchie
  - Navigation über Benutzermenü: "🏪 Geschäfte verwalten"
- ✅ **Produkt-Verwaltung**: Dedizierte Admin-Seite für Produkte
  - **CRUD-Operationen**: Erstellen, Bearbeiten und Löschen von Produkten
  - **Store- und Department-Zuordnung**: Jedes Produkt ist einem Store und einer Abteilung zugeordnet
  - **Frische-Kennzeichnung**: Optionale Markierung für frische/verderbliche Produkte
  - **Store-Filter**: Anzeige und Verwaltung nach ausgewähltem Geschäft
  - Navigation über Benutzermenü: "📦 Produkte verwalten"
- ✅ **Mengenangaben mit Smart-Merging & Fuzzy Matching**: Optionale Mengenangaben für jeden Artikel (z.B. "500 g", "2 Stück")
  - **Kommagetrennte Eingaben**: Mehrere Mengen gleichzeitig eingeben (z.B. "2, 500 g")
  - Automatisches Summieren von Mengen mit gleicher Einheit
  - Intelligente Suche in kommagetrennte Listen
  - **Fuzzy Matching**: Ähnliche Produktnamen werden automatisch zusammengeführt
    - "Möhre" wird zu "Möhren" hinzugefügt (Singular/Plural)
    - "Moehre" wird zu "Möhren" hinzugefügt (alternative Schreibweise)
    - "Kartoffel" wird zu "Kartoffeln" hinzugefügt
  - **Datums-basiertes Merging**: Mengen werden NUR summiert, wenn das Einkaufsdatum identisch ist
    - Items mit unterschiedlichen Einkaufsdaten werden separat geführt
    - Ermöglicht Planung für mehrere Einkaufstouren
  - Beispiele (gleiches Datum):
    - "Möhren 500 g" + "Möhren 300 g" = "Möhren 800 g"
    - "Zucker 500 g, 2 Packungen" + "Zucker 300 g" = "Zucker 800 g, 2 Packungen"
    - "Reis 500 g" + "2, 300 g" = "Reis 800 g, 2"
  - Beispiele (unterschiedliche Daten):
    - "Möhren 500 g" [15.01.2025] + "Möhren 300 g" [17.01.2025] = Zwei separate Items
- ✅ **Einkaufsdatum**: Optionale Datumsangabe für geplanten Einkauf
  - **DatePicker-Komponente**: Benutzerfreundlicher Kalender mit deutscher Lokalisierung
  - **Automatische Vorauswahl**: Standard ist der nächste Mittwoch
  - **Visuelles Design**: Aktueller Tag ist deutlich hervorgehoben (rot hinterlegt)
  - **Flexibel**: Datum kann geändert oder gelöscht werden
  - **Anzeige**: Datum wird in der Liste neben jedem Item angezeigt [DD.MM.YYYY]
  - **Intelligentes Merging**: Items werden nur bei gleichem Datum zusammengeführt
- ✅ **Reaktive UI**: Automatische UI-Updates durch State-Management mit Observer Pattern
- ✅ **Component Library**: Wiederverwendbare UI-Komponenten mit konsistentem Design (9 Komponenten)
  - **Button**: Konfigurierbare Buttons (primary, secondary, danger) mit verschiedenen Größen
  - **Modal**: Modale Dialoge mit Backdrop und Animationen
  - **Card**: Content-Cards mit optionalen Aktionen
  - **Input**: Formular-Inputs mit Validierung und Fehleranzeige
  - **Loading**: Spinner, Overlay und Skeleton-Loader
  - **Dropdown**: Native und durchsuchbare Dropdown-Menüs mit Fuzzy-Search
  - **Tabs**: Tab-Navigation für organisierte Content-Bereiche
  - **Toast**: Nicht-blockierende Benachrichtigungen (success, error, warning, info)
    - Ersetzt alle `alert()` Aufrufe für bessere UX
    - Auto-Dismiss mit konfigurierbarer Dauer
    - Positionierbar (top/bottom, left/center/right)
    - Dismissible mit X-Button
    - Stacking von mehreren Toasts
  - **DatePicker**: Voll funktionsfähiger Kalender für Datumsauswahl
    - Deutsche Monate und Wochentage
    - 3 Datumsformate (dd.MM.yyyy, yyyy-MM-dd, MM/dd/yyyy)
    - Min/Max-Datum-Einschränkungen
    - Heute/Löschen-Buttons
    - Responsives Design
- ✅ **Vollständige Tests**: 509 Tests (64 Server + 445 Client) mit 85%+ Code-Abdeckung
- ✅ **TypeScript Client**: Typsicherer Client mit vier-Schichten-Architektur
- ✅ **FastAPI Server**: Moderne Python API mit SQLModel ORM
- ✅ **Benutzer-Verwaltung**: Freischaltungs-System für neue Benutzer
  - **Administrator-Account**: Wird automatisch beim Serverstart aus `.env` erstellt/aktualisiert
  - **Freischaltungs-Prozess**: Neue Benutzer müssen von freigeschalteten Benutzern genehmigt werden
  - **Verwaltungsseite**: Dedizierte `/users` Seite mit übersichtlicher Card-basierter UI
    - **Ausstehende Genehmigungen**: Separater Bereich für Pending-Users (orange)
    - **Alle Benutzer**: Übersichtliche Liste sortiert nach Status mit Farbcodierung
    - **Status-Badges**: ⏳ Ausstehend, ✓ Freigeschaltet, 👑 Administrator, ❌ Inaktiv
  - **Admin-Funktionen**:
    - Benutzer freischalten (✓ Freischalten Button)
    - Benutzer löschen (🗑️ Löschen Button, nur für Admins sichtbar)
    - Schutz vor Selbst-Löschung
    - **Hinweis**: Items werden nicht gelöscht (gemeinsame Einkaufsliste)
  - **Auto-Cleanup**: Nicht freigeschaltete Benutzer werden nach konfigurierbarer Zeit automatisch gelöscht (Standard: 48 Stunden)
  - **Selbstverwaltung**: Jeder Benutzer (außer Administratoren) kann den eigenen Account auf der User-Management-Seite löschen
    - "Eigenen Account löschen"-Sektion am Ende der User-Management-Seite
    - Nicht verfügbar für Administratoren (aus Sicherheitsgründen)
    - Mit Bestätigungsdialog und Warnhinweis
  - Navigation über Benutzermenü: "👥 Benutzer verwalten"

## Project Structure

```
├── server/
│   ├── src/
│   │   ├── __init__.py       # Package initialization
│   │   ├── app.py            # Simple HTTP server (stdlib)
│   │   ├── main.py           # FastAPI application (92 Zeilen - Kern-Funktionalität)
│   │   ├── models.py         # SQLModel data models (Item, Store, Department, Product)
│   │   ├── user_models.py    # User authentication models
│   │   ├── auth.py           # JWT authentication utilities
│   │   ├── admin_setup.py    # Admin user setup utilities
│   │   ├── user_cleanup.py   # User cleanup utilities
│   │   ├── db.py             # Database utilities
│   │   ├── seed_data.py      # Database seed data (stores, departments, products)
│   │   ├── schemas.py        # Request/Response models (Pydantic schemas)
│   │   ├── utils.py          # Helper functions (quantity parsing, fuzzy matching)
│   │   └── routers/          # API routers (modular endpoint organization)
│   │       ├── __init__.py   # Router package initialization
│   │       ├── auth.py       # Authentication endpoints (register, login, /me, refresh)
│   │       ├── users.py      # User management endpoints (list, approve)
│   │       ├── stores.py     # Store & department endpoints (CRUD, sorting)
│   │       ├── products.py   # Product endpoints (CRUD, fuzzy search)
│   │       ├── items.py      # Shopping list item endpoints (CRUD, smart merging)
│   │       └── pages.py      # Static page serving endpoints (HTML pages)
│   └── tests/
│       ├── conftest.py              # Pytest fixtures
│       ├── test_api.py              # API integration tests (13 tests)
│       ├── test_auth.py             # Authentication tests (10 tests)
│       ├── test_stores.py           # Store/Department/Product CRUD tests (30 tests)
│       └── test_user_management.py  # User management tests (10 tests)
├── client/
│   ├── src/
│   │   ├── data/                 # Data layer (API, auth, DOM utilities)
│   │   │   ├── api.ts            # API client functions (items, stores, departments, products)
│   │   │   ├── api.test.ts       # API tests
│   │   │   ├── auth.ts           # Authentication utilities
│   │   │   ├── dom.ts            # DOM utilities
│   │   │   └── dom.test.ts       # DOM tests
│   │   ├── ui/                   # UI layer (feature-specific UI modules)
│   │   │   ├── components/       # Reusable UI component library
│   │   │   │   ├── button.ts     # Button component
│   │   │   │   ├── modal.ts      # Modal dialog component
│   │   │   │   ├── card.ts       # Card component
│   │   │   │   ├── input.ts      # Input component with validation
│   │   │   │   ├── loading.ts    # Loading spinner and skeleton components
│   │   │   │   ├── dropdown.ts   # Dropdown/select component (native & searchable)
│   │   │   │   ├── tabs.ts       # Tab navigation component
│   │   │   │   ├── toast.ts      # Toast notification system
│   │   │   │   └── index.ts      # Component library exports & initialization
│   │   ├── state/                # State layer (state management)
│   │   │   ├── shopping-list-state.ts      # Shopping list state manager
│   │   │   ├── shopping-list-state.test.ts # State tests
│   │   │   ├── store-state.ts              # Store/product state manager
│   │   │   ├── user-state.ts               # User state manager
│   │   │   └── user-state.test.ts          # State tests
│   │   │   ├── shopping-list-ui.ts   # Shopping list UI module
│   │   │   ├── store-browser.ts      # Store/product browser UI module
│   │   │   ├── store-admin.ts        # Store administration UI (CRUD)
│   │   │   ├── product-admin.ts      # Product administration UI (CRUD)
│   │   │   ├── user-admin.ts         # User administration UI (approval)
│   │   │   └── user-menu.ts          # User menu module
│   │   ├── pages/                # Pages layer (page controllers & templates)
│   │   │   ├── login.ts          # Login page controller
│   │   │   ├── login.html        # Login HTML template
│   │   │   ├── app.html          # App HTML template (with store browser)
│   │   │   ├── stores.html       # Store admin HTML template
│   │   │   ├── products.html     # Product admin HTML template
│   │   │   └── users.html        # User admin HTML template
│   │   ├── script.ts             # Main app entry point
│   │   ├── script-stores.ts      # Store admin entry point
│   │   ├── script-products.ts    # Product admin entry point
│   │   ├── script-users.ts       # User admin entry point
│   │   └── index-login.ts        # Login entry point
│   ├── dist/                 # Compiled JavaScript
│   ├── index.html            # Login page
│   ├── index-app.html        # Main app page
│   ├── index-stores.html     # Store admin page
│   ├── index-products.html   # Product admin page
│   ├── index-users.html      # User admin page
│   ├── favicon.svg           # Application icon
│   ├── styles.css            # Styles
│   ├── package.json          # Node dependencies
│   ├── tsconfig.json         # TypeScript config
│   └── jest.config.js        # Jest config
├── .env.example              # Environment variables template
├── .env                      # Environment variables (not in git)
└── pyproject.toml            # Python project config
```

## Voraussetzungen

- Python 3.13+ (empfohlen) oder Python 3.10+
- Node.js 16+ für TypeScript/Client-Build
- pip und npm

## Installation & Entwicklung

### 1. Virtuelle Umgebung erstellen

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 2. Python-Abhängigkeiten installieren

```powershell
pip install -e .[dev]
```

Dies installiert alle benötigten Pakete:
- FastAPI & Uvicorn (Web-Framework & Server)
- SQLModel (ORM für Datenbankzugriff)
- python-jose & bcrypt (JWT & Passwort-Hashing)
- pytest, black, flake8 (Testing & Code-Qualität)

### 3. Umgebungsvariablen konfigurieren

```powershell
# Beispieldatei kopieren
copy .env.example .env

# Sicheren SECRET_KEY generieren
python -c "import secrets; print(secrets.token_hex(32))"
```

Tragen Sie den generierten Key und die Admin-Zugangsdaten in die `.env` Datei ein:

```env
SECRET_KEY=ihr-generierter-key-hier
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Admin User Configuration
ADMIN_USERNAME=admin
ADMIN_PASSWORD=ihr-sicheres-passwort
ADMIN_EMAIL=admin@example.com

# User Approval Settings
UNAPPROVED_USER_EXPIRY_HOURS=48
```

**Wichtig**:
- Der SECRET_KEY und ADMIN_PASSWORD sollten geheim bleiben und niemals in Git committet werden!
- Der Admin-Account wird beim Serverstart automatisch erstellt/aktualisiert
- Ändern Sie das Admin-Passwort vor dem produktiven Einsatz!

### 4. Client Build (TypeScript)

```powershell
cd client
npm install
npm run build
cd ..
```

### 5. Server starten

**Für Netzwerkzugriff (empfohlen - Server ist über IP erreichbar):**
```powershell
# Mit venv:
venv\Scripts\python.exe -m uvicorn server.src.main:app --reload --host 0.0.0.0 --port 8000

# Oder global (falls uvicorn installiert):
uvicorn server.src.main:app --reload --host 0.0.0.0 --port 8000
```

**Nur lokaler Zugriff (Standard):**
```powershell
# Mit venv:
venv\Scripts\python.exe -m uvicorn server.src.main:app --reload --port 8000

# Oder global (falls uvicorn installiert):
uvicorn server.src.main:app --reload --port 8000
```

Mit `--host 0.0.0.0` läuft der Server auf **allen Netzwerkschnittstellen** und ist über die IP-Adresse erreichbar:
- **Local**: `http://127.0.0.1:8000` - für lokalen Zugriff
- **Network**: `http://<ihre-ip>:8000` - für Zugriff von anderen Geräten im Netzwerk

### 6. Anwendung öffnen

**Lokaler Zugriff:**
Öffnen Sie Ihren Browser und navigieren Sie zu: **http://localhost:8000/**

**Netzwerkzugriff (von anderen Geräten):**
1. Notieren Sie die Network-URL, die beim Serverstart angezeigt wird (z.B. `http://192.168.1.100:8000`)
2. Stellen Sie sicher, dass die Windows Firewall den Port 8000 erlaubt:
   ```powershell
   # Firewall-Regel hinzufügen (als Administrator ausführen)
   netsh advfirewall firewall add rule name="Einkaufsliste HTTP" dir=in action=allow protocol=TCP localport=8000
   ```
3. Öffnen Sie die Network-URL auf einem anderen Gerät im gleichen Netzwerk

Sie sehen zuerst die Login-Seite. Registrieren Sie einen neuen Benutzer und melden Sie sich an.

### 7. Einkaufsliste nutzen

Nach dem Login können Sie die Einkaufsliste verwenden:
1. **Automatische Geschäfts-Auswahl**: Das erste Geschäft wird automatisch ausgewählt
2. **Produkte hinzufügen**: Geben Sie den Produktnamen ein (z.B. "Möhren")
3. **Automatisches Matching**: Das System findet automatisch das passende Produkt im Katalog
4. **Abteilungs-Gruppierung**: Items werden automatisch nach Abteilungen gruppiert angezeigt
   - Spalten-Layout auf Desktop (z.B. "Obst & Gemüse", "Milchprodukte", "Sonstiges")
   - Gestapeltes Layout auf Mobile
5. **Items entfernen**: Klicken Sie auf das Papierkorb-Icon (🗑️) neben dem Item
6. **Produktkatalog erweitern**: Items in "Sonstiges" können dem Katalog hinzugefügt werden
   - Klicken Sie auf das Bearbeiten-Icon (✏️) neben einem Item in "Sonstiges"
   - Wählen Sie eine Abteilung aus dem Dialog
   - Das Produkt wird automatisch dem Katalog hinzugefügt (ohne Mengenangaben)
   - Das Item erscheint danach in der gewählten Abteilung
7. **Items vor Datum löschen**: Klicken Sie auf "🗓️ Vor Datum löschen" um alte Einträge zu entfernen
   - Wählen Sie ein Datum im DatePicker
   - Alle Items mit Einkaufsdatum vor dem gewählten Datum werden gelöscht
   - Bei ausgewähltem Geschäft: Nur Items dieses Geschäfts werden gelöscht
   - Bei "Alle Geschäfte": Alle Items (geschäftsübergreifend) werden gelöscht
   - Sicherheitsabfrage mit Angabe der Anzahl betroffener Items

### 8. Store- und Produkt-Verwaltung nutzen

Sie können Geschäfte, Abteilungen und Produkte verwalten:

**Geschäfte und Abteilungen verwalten:**
1. Klicken Sie auf das Menü (⋮) im Header
2. Wählen Sie **"🏪 Geschäfte verwalten"**
3. Erstellen, bearbeiten oder löschen Sie Stores und Departments
4. **Geschäftsreihenfolge ändern**: Nutzen Sie die ↑↓ Buttons im Store-Header
   - Die Reihenfolge bestimmt, wie Geschäfte im Auswahlmenü angezeigt werden
   - Erste Position = Standardgeschäft beim Laden der App
   - ↑ Button ist beim ersten Geschäft deaktiviert
   - ↓ Button ist beim letzten Geschäft deaktiviert
5. **Abteilungsreihenfolge ändern**: Nutzen Sie die ↑↓ Buttons neben jeder Abteilung
   - Die Reihenfolge bestimmt, wie Abteilungen in der Einkaufsliste angezeigt werden
   - Änderungen werden sofort in der Shopping-Liste übernommen
6. **Hinweis**: Beim Löschen eines Stores werden automatisch alle zugehörigen Departments und Products entfernt

**Produkte verwalten:**
1. Klicken Sie auf das Menü (⋮) im Header
2. Wählen Sie **"📦 Produkte verwalten"**
3. Wählen Sie ein Geschäft aus dem Dropdown
4. Erstellen, bearbeiten oder löschen Sie Produkte
5. Ordnen Sie Produkte Abteilungen zu und kennzeichnen Sie frische Produkte

## Authentifizierung

Die Anwendung verwendet **JWT (JSON Web Tokens)** für sichere Authentifizierung:

### Funktionsweise

1. **Registrierung**: Besuchen Sie http://localhost:8000/ und erstellen Sie einen Account
   - Benutzername, E-Mail und Passwort eingeben
   - Passwörter werden mit bcrypt sicher gehasht
   - Passwortlänge: 6-72 Zeichen

2. **Login**: Melden Sie sich mit Ihren Zugangsdaten an
   - Bei erfolgreicher Anmeldung erhalten Sie einen JWT-Token
   - Token wird automatisch im localStorage gespeichert
   - Token ist 30 Minuten gültig (konfigurierbar)

3. **API-Zugriff**: Alle API-Anfragen nutzen den Token
   - Token wird als `Authorization: Bearer <token>` Header mitgeschickt
   - Bei ungültigem/abgelaufenem Token: Automatische Weiterleitung zum Login
   - **Automatisches Token-Refresh**: Bei jedem API-Aufruf wird das Token automatisch erneuert
   - Dies verlängert die Token-Gültigkeit bei jeder Aktivität (kein Timeout bei aktiver Nutzung)
   - **Optimiert**: Singleton-Pattern verhindert mehrfache gleichzeitige Refresh-Anfragen
   - **Cooldown**: 5-Sekunden-Cooldown verhindert übermäßige Refresh-Requests

4. **Account-Verwaltung**:
   - Klicken Sie auf das **Drei-Punkte-Menü** (⋮) in der rechten oberen Ecke
   - **Abmelden**: Wählen Sie "Abmelden" um sich auszuloggen (Token wird gelöscht)
   - **Account löschen**: Gehen Sie zu "👥 Benutzer verwalten" → Scrollen Sie zum Ende der Seite
     - "Eigenen Account löschen"-Sektion (nur für Nicht-Administratoren sichtbar)
     - Beim Löschen wird eine Bestätigung abgefragt
     - Nach erfolgreicher Löschung wird der Token invalidiert und Sie werden zum Login weitergeleitet

### Umgebungsvariablen

| Variable | Beschreibung | Standard | Pflicht |
|----------|--------------|----------|---------|
| `SECRET_KEY` | Geheimer Schlüssel für JWT-Signierung | `dev-secret-key-change-in-production` | Ja (Produktion) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token-Gültigkeitsdauer in Minuten | `30` | Nein |
| `DATABASE_URL` | Datenbank-Verbindungs-URL | `sqlite:///./data.db` | Nein |
| `ADMIN_USERNAME` | Administrator-Benutzername | - | Ja |
| `ADMIN_PASSWORD` | Administrator-Passwort | - | Ja |
| `ADMIN_EMAIL` | Administrator-E-Mail | `admin@example.com` | Nein |
| `UNAPPROVED_USER_EXPIRY_HOURS` | Stunden bis nicht freigeschaltete Benutzer gelöscht werden | `48` | Nein |

### Sicherheitshinweise

- **Niemals** den `SECRET_KEY` in Git committen
- In Produktion einen starken, zufälligen `SECRET_KEY` verwenden (min. 32 Bytes)
- Die `.env` Datei ist durch `.gitignore` geschützt
- Passwörter werden mit bcrypt gehasht (Salt-Runden: automatisch)
- HTTPS in Produktion verwenden für sicheren Token-Transport

### API-Endpunkte

**Authentifizierung:**
- `POST /api/auth/register` - Neuen Benutzer registrieren (Status: unapproved)
- `POST /api/auth/login` - Login und Token erhalten (nur für freigeschaltete Benutzer)
- `POST /api/auth/refresh` - Token erneuern (authentifiziert)
- `GET /api/auth/me` - Aktuelle Benutzerinfo abrufen (authentifiziert)
- `DELETE /api/auth/me` - Eigenen Account löschen (authentifiziert)

**Benutzer-Verwaltung (alle authentifiziert und freigeschaltet):**
- `GET /api/users` - Alle Benutzer abrufen
- `GET /api/users/pending` - Nicht freigeschaltete Benutzer abrufen
- `POST /api/users/{user_id}/approve` - Benutzer freischalten
- `DELETE /api/users/{user_id}` - Benutzer löschen (nur für Administratoren)
  - Verhindert Selbst-Löschung (Admin muss `DELETE /api/auth/me` verwenden)
  - **Hinweis**: Items werden NICHT gelöscht, da die Einkaufsliste eine gemeinsame Liste ist (Items haben `user_id=None`)

**Store Management (alle authentifiziert):**
- `GET /api/stores` - Alle Geschäfte abrufen (sortiert nach sort_order, dann ID)
- `POST /api/stores` - Neues Geschäft erstellen
  - Body: `{"name": "Geschäftsname", "location": "Standort"}` (location optional)
- `PUT /api/stores/{store_id}` - Geschäft aktualisieren (Name, Standort und/oder Sortierreihenfolge)
  - Body: `{"name": "Neuer Name", "location": "Neuer Standort", "sort_order": 5}` (alle Felder optional, partial update)
  - Beispiel nur sort_order: `{"sort_order": 2}` (für Reordering)
- `DELETE /api/stores/{store_id}` - Geschäft löschen (cascading: löscht auch Departments und Products)
- `GET /api/stores/{store_id}/departments` - Abteilungen eines Geschäfts (sortiert nach sort_order)
- `POST /api/departments` - Neue Abteilung erstellen
  - Body: `{"name": "Abteilungsname", "sort_order": 0}` (sort_order optional, default: 0)
- `PUT /api/departments/{department_id}` - Abteilung aktualisieren (Name und/oder Sortierreihenfolge)
  - Body: `{"name": "Neuer Name", "sort_order": 5}` (beide Felder optional, partial update)
- `DELETE /api/departments/{department_id}` - Abteilung löschen (cascading: löscht auch Products)
- `GET /api/stores/{store_id}/products` - Alle Produkte eines Geschäfts
- `GET /api/departments/{department_id}/products` - Produkte einer Abteilung

**Product Management (alle authentifiziert):**
- `POST /api/products` - Neues Produkt erstellen
- `PUT /api/products/{product_id}` - Produkt aktualisieren
- `DELETE /api/products/{product_id}` - Produkt löschen

**Shopping List (alle authentifiziert, gemeinsame Liste):**
- `GET /api/items` - Alle Artikel der gemeinsamen Einkaufsliste abrufen
  - Response: `ItemWithDepartment` - Enthält `department_id`, `department_name` und `department_sort_order` für Gruppierung und Sortierung
  - **Gemeinsame Liste**: Alle authentifizierten Benutzer sehen dieselben Items
- `POST /api/items` - Neuen Artikel zur gemeinsamen Liste hinzufügen oder Menge aktualisieren
  - Body: `{"name": "Artikelname", "menge": "500 g", "store_id": 1}` (menge und store_id sind optional)
  - Response: `ItemWithDepartment` - Enthält Department-Informationen inkl. sort_order für sofortiges Rendering
  - Beispiele:
    - `{"name": "Möhren", "menge": "500 g", "store_id": 1}` → Automatisches Matching zu Produkt "Möhren" in Abteilung "Obst & Gemüse"
    - `{"name": "Milch", "store_id": 1}` (ohne Menge) → Matching zu "Milch" in "Milchprodukte"
    - `{"name": "Reis", "menge": "2, 500 g"}` (kommagetrennte Eingabe)
  - **Automatisches Produkt-Matching**: Wenn `store_id` angegeben ist:
    - Fuzzy-Matching gegen alle Produkte im Store (60% Schwellwert)
    - Automatische Zuweisung von `product_id` bei Match
    - Normalisierung deutscher Umlaute (ä→ae, ö→oe, ü→ue, ß→ss)
  - **Smart-Merging mit Einheiten-Suche & Fuzzy Matching**: Wenn ein Artikel bereits in der gemeinsamen Liste existiert oder ähnlich ist:
    - **Gemeinsame Liste**: Alle Items in der Liste werden berücksichtigt (keine Benutzer-spezifische Filterung)
    - **Fuzzy Matching**: Ähnliche Namen werden erkannt ("Möhre" → "Möhren", "Moehre" → "Möhren")
    - **Kommagetrennte Eingaben**: Mehrere Mengen werden separat verarbeitet ("2, 500 g" → ["2", "500 g"])
    - Gleiche Einheit → Mengen werden summiert (z.B. "500 g" + "300 g" = "800 g")
    - Verschiedene Einheiten → Als kommagetrennte Liste gespeichert (z.B. "500 g" + "2 Packungen" = "500 g, 2 Packungen")
    - Einheit in Liste vorhanden → Nur diese Einheit wird summiert (z.B. "500 g, 2 Packungen" + "300 g" = "800 g, 2 Packungen")
    - Keine Einheit → Zahlen werden summiert (z.B. "6" + "12" = "18")
  - **Keine Benutzer-Zuordnung**: Items werden mit `user_id=None` erstellt (gehören zur gemeinsamen Liste)
- `GET /api/stores/{store_id}/products/search?q={query}` - Fuzzy-Suche nach Produkten in einem Store
  - Query-Parameter: `q` (Produktname)
  - Response: Bestes Match (≥60% Ähnlichkeit) oder `null`
- `POST /api/items/{item_id}/convert-to-product` - Item in Produkt konvertieren und Abteilung zuweisen
  - Body: `{"department_id": 1}` (ID der Abteilung)
  - Response: `ItemWithDepartment` - Aktualisiertes Item mit Department-Informationen
  - Funktion:
    - Erstellt neues Produkt mit Item-Name (ohne Mengenangaben)
    - Ordnet Produkt der angegebenen Abteilung zu
    - Aktualisiert Item mit `product_id` Referenz
    - Nutzt vorhandenes Produkt, falls gleichnamiges bereits existiert
  - Authentifizierung erforderlich: Alle authentifizierten Benutzer können Items aus der gemeinsamen Liste konvertieren
- `DELETE /api/items/{id}` - Artikel aus der gemeinsamen Liste löschen (alle authentifizierten Benutzer)
- `DELETE /api/items/by-date/{before_date}?store_id={store_id}` - Items vor einem Datum löschen
  - Path-Parameter: `before_date` (ISO-Format YYYY-MM-DD)
  - Query-Parameter: `store_id` (optional, filtert nach Geschäft)
  - Response: `{"deleted_count": number}` - Anzahl der gelöschten Items
  - Löscht alle Items mit `shopping_date < before_date`
  - Authentifizierung erforderlich: Alle authentifizierten Benutzer können Items löschen

## Code-Qualität

### Formatierung mit Black

```powershell
black server/
```

Black formatiert den Python-Code automatisch nach PEP 8 Standards.

**Pre-Commit Hook:**
Das Projekt enthält einen Git pre-commit-hook, der automatisch alle Python-Dateien im `server/` Verzeichnis mit Black formatiert:
- Hook-Datei: `.git/hooks/pre-commit`
- Wird automatisch vor jedem Commit ausgeführt
- Formatiert nur Dateien im `server/` Verzeichnis
- Verhindert Commits mit unformatiertem Code
- Zeigt an, welche Dateien formatiert wurden

Der Hook ist bereits installiert und einsatzbereit. Falls Black nicht verfügbar ist, wird eine Fehlermeldung angezeigt.

### Linting mit Flake8

```powershell
flake8 server/
```

Flake8 prüft auf Code-Smell, Stil-Verstöße und potenzielle Fehler.

## Testing

### Server Tests (Python/pytest)

```powershell
# Alle Tests ausführen
pytest

# Mit detaillierter Ausgabe
pytest -v

# Nur Authentifizierung testen
pytest server/tests/test_auth.py -v

# Nur API testen
pytest server/tests/test_api.py -v

# Mit Coverage-Report
pytest --cov=server --cov-report=html
```

**Aktuelle Test-Abdeckung:**
- ✅ **64 Tests insgesamt**
  - **85% Code-Coverage** für Server-Code
- ✅ **Authentifizierung** (10 Tests):
  - Registrierung, Login, Token-Validierung, Token-Refresh, Account-Löschung
  - Genehmigungsprüfung beim Login
- ✅ **Shopping-List CRUD** (14 Tests):
  - **Item zu Produkt konvertieren**: Items aus "Sonstiges" in Produktkatalog aufnehmen (2 Tests)
    - Neues Produkt erstellen und Abteilung zuweisen
    - Vorhandenes Produkt wiederverwenden
  - **Items vor Datum löschen**: Items basierend auf Einkaufsdatum löschen (2 Tests)
    - Allgemeine Löschung ohne Store-Filter
    - Gefilterte Löschung nach Store
  - CRUD-Operationen mit JWT-Authentifizierung
  - **Mengenangaben**: Items mit und ohne optionale Menge
  - **Smart-Merging mit Einheiten-Suche**:
    - Summierung bei gleicher Einheit ("500 g" + "300 g" = "800 g")
    - Kombination bei verschiedenen Einheiten ("500 g" + "2 Packungen" = "500 g, 2 Packungen")
    - Intelligente Suche in kommagetrennte Listen ("500 g, 2 Packungen" + "300 g" = "800 g, 2 Packungen")
    - Summierung ohne Einheit ("6" + "12" = "18")
    - **Kommagetrennte Eingaben**: Verarbeitung mehrerer Mengen ("500 g" + "2, 300 g" = "800 g, 2")
  - **Fuzzy Matching**:
    - Ähnliche Produktnamen werden erkannt ("Möhre" → "Möhren")
    - Alternative Schreibweisen ("Moehre" → "Möhren")
    - Singular/Plural ("Kartoffel" → "Kartoffeln")
    - Keine False Positives bei unterschiedlichen Produkten
  - **Geteilte Einkaufsliste**: Alle authentifizierten Benutzer teilen sich eine gemeinsame Liste
    - Items haben keine Benutzer-Zuordnung mehr (`user_id=None`)
    - Jeder authentifizierte Benutzer kann alle Items sehen, hinzufügen, bearbeiten und löschen
    - Ideal für Haushalts-Einkaufslisten
- ✅ **Store Management & CRUD** (30 Tests):
  - **Store CRUD** (12 Tests):
    - Stores erstellen, abrufen, aktualisieren, löschen
    - Validierung (leerer Name, zu langer Name)
    - **Store-Sortierung**: Update sort_order, partielle Updates, Sortierreihenfolge-Tests
    - Cascading Delete: Löscht automatisch zugehörige Departments und Products
  - **Department CRUD** (7 Tests):
    - Departments erstellen, abrufen, aktualisieren, löschen
    - Validierung (Store-Existenz, leerer Name)
    - Cascading Delete: Löscht automatisch zugehörige Products
  - **Product CRUD** (8 Tests):
    - Products erstellen, abrufen, aktualisieren, löschen
    - Validierung (Store-Existenz, Department-Existenz, Department-Store-Zuordnung)
    - Partial Updates (optionale Felder)
  - **Beziehungen & Constraints** (3 Tests):
    - Store-Department-Product Hierarchie
    - Cascading Deletes über mehrere Ebenen
    - Fehlerbehandlung für nicht existierende Ressourcen
- ✅ **Benutzer-Verwaltung** (10 Tests):
  - Registrierung erstellt nicht genehmigte Benutzer (`is_approved=False`)
  - Login-Sperre für nicht genehmigte Benutzer (403 Forbidden)
  - Alle Benutzer abrufen (nur für genehmigte Benutzer)
  - Ausstehende Benutzer abrufen (nicht genehmigte)
  - Benutzer genehmigen (`POST /api/users/{id}/approve`)
  - Genehmigter Benutzer kann sich anmelden
  - Authentifizierungschecks für alle User-Management-Endpoints
  - Genehmigte Benutzer können andere genehmigen
  - Account-Löschung, Token-Invalidierung
- ✅ Geschützte Endpunkte (401/403 Tests)
- ✅ Token-Refresh-Mechanismus

### Client Tests (TypeScript/Jest)

```powershell
cd client

# Tests ausführen
npm test

# Mit Coverage
npm run test:coverage

# Watch-Modus (automatisch bei Änderungen)
npm test -- --watch
```

**Aktuelle Test-Abdeckung:**
- ✅ **445 Tests insgesamt** (19 Test-Suites)
  - **85.46% Code-Coverage** für Client-Code
  - Neue Module `user-admin.ts` und `script-users.ts` noch ohne Tests (0%)
- ✅ Data Layer: API Client (94), Authentication (36), DOM (18) = 148 Tests
  - Inklusive 401 Handling & Token Refresh Failures
  - Inklusive Token-Refresh-Optimierung (Singleton, Cooldown, Concurrent Requests)
  - Inklusive Template-Caching (Memory Cache, Load Flag, Zero Network Cost)
  - Inklusive DOM-Batching (DocumentFragment, O(1) Reflows)
  - Tests für Mengenangaben in API und DOM
  - Tests für Department-Gruppierung und Sortierung
  - Tests für Edit-Icon in "Sonstiges" Items
  - **Vollständige CRUD-Abdeckung**: Stores (inkl. updateStore), Departments, Products (alle Operationen getestet)
  - **Store-Update-Tests**: Vollständige/partielle Updates, sort_order, Fehlerbehandlung
  - **Convert-Item-to-Product Tests**: API-Funktion für Item-Konvertierung
- ✅ State Layer: Shopping List State (36), User State (24), Store State (34) = 94 Tests
  - Inklusive Observer Pattern, Subscriptions, Reactivity
  - Inklusive Loading State Tracking
  - Inklusive Immutability Tests
  - Tests für Mengenangaben im State
  - Test für Fuzzy-Matching-Update (verhindert Duplikate)
  - Tests für Store/Department/Product State Management
- ✅ UI Layer: Shopping List UI (29), User Menu (16), Store Admin (27), Product Admin (15) = 87 Tests
  - Tests für Mengenfeld-Eingabe
  - Tests für CRUD-Operationen
  - **Shopping List UI Tests (29)**:
    - Edit-Button Funktionalität (8 Tests): Dialog-Anzeige, Department-Auswahl, Fehlerbehandlung
    - Item-Deletion und DatePicker Integration
    - DatePicker Modal-Funktionalität für Date-Based Deletion
  - **Store Admin Tests**: Store-Reordering (↑↓ Buttons), Department-Reordering
  - Product Admin Tests: Store-Auswahl, Department-Verwaltung, Form-Validierung
- ✅ Pages Layer: Login Controller (20) = 20 Tests
- ✅ Entry Points: script.ts (7), script-stores.ts (9), script-products.ts (9), index-login.ts (4) = 29 Tests
  - Tests für DOMContentLoaded Event-Handling
  - Tests für Authentication Checks
  - Tests für Template Loading
- ✅ Error Handling, Edge Cases, User Interactions

**Gesamt-Teststatistik:**
- 📊 **Server**: 64 Tests, 85% Coverage
- 📊 **Client**: 445 Tests, 85.46% Coverage
- 📊 **Gesamt**: 509 Tests ✅

### Continuous Integration (CI)

Das Projekt nutzt GitHub Actions für automatisierte Tests bei jedem Push/Pull Request:

**Server Tests (Python):**
- Black Code-Formatierung prüfen
- Flake8 Linting
- Pytest Tests (64 Tests mit 85% Coverage)

**Client Tests (TypeScript):**
- TypeScript Build
- Jest Tests (445 Tests mit 85.46% Coverage)

Beide Jobs laufen parallel für maximale Geschwindigkeit. Die CI-Konfiguration befindet sich in `.github/workflows/ci.yml`.

## Entwickler-Notizen

### Datenbank

- SQLite wird für lokale Entwicklung verwendet
- Datenbank-Datei: `data.db` (wird automatisch erstellt)
- Schema wird beim ersten Start automatisch erstellt
- **Automatisches Seeding**: Beim ersten Start werden Beispieldaten geladen:
  - 3 Geschäfte: Rewe, Edeka, Kaufland
  - 27 Abteilungen (9 pro Geschäft)
  - 17 Produkte für Rewe
- **Datenbankschema**:
  - `user` - Benutzerkonten
  - `store` - Geschäfte (mit sort_order für benutzerdefinierte Reihenfolge)
  - `department` - Abteilungen (mit Foreign Key zu store, sort_order für Reihenfolge)
  - `product` - Produkte (mit Foreign Keys zu store und department)
  - `item` - Einkaufslisten-Items (mit Foreign Keys zu user und optional zu product)
- Für Tests: In-Memory-Datenbank (siehe `conftest.py`)

### Technologie-Stack

**Backend:**
- FastAPI 0.120+ (Async Web-Framework)
- SQLModel 0.0.27 (ORM basierend auf SQLAlchemy & Pydantic)
- python-jose 3.5+ (JWT-Implementierung)
- bcrypt 4.3+ (Passwort-Hashing)
- pytest 8.4+ (Testing)

**Frontend:**
- TypeScript 5+ (Typsicheres JavaScript)
- ES2020 Module (Native Browser-Module)
- Jest (Testing Framework)
- Vanilla JS/DOM (kein Framework)

### Server-Architektur

Der Server folgt einer **modularen Router-basierten Architektur** für bessere Wartbarkeit:

#### **Kern-Module** (`src/`)
- **main.py** (92 Zeilen) - Application Factory & Router-Registration
- **models.py** - SQLModel ORM Modelle (Item, Store, Department, Product)
- **user_models.py** - User & Auth Modelle
- **db.py** - Datenbank-Engine & Session-Management
- **auth.py** - JWT-Token-Utilities (create, verify, get_current_user)
- **schemas.py** - Request/Response Pydantic Models
- **utils.py** - Helper-Funktionen (quantity parsing, fuzzy matching, normalization)

#### **API Routers** (`src/routers/`)
Modulare Organisation von API-Endpunkten:
- **auth.py** (197 Zeilen) - Authentication Endpoints
  - `POST /api/auth/register` - User registration
  - `POST /api/auth/login` - User login
  - `GET /api/auth/me` - Current user info
  - `POST /api/auth/refresh` - Token refresh
  - `DELETE /api/auth/me` - Account deletion
- **users.py** (149 Zeilen) - User Management Endpoints
  - `GET /api/users` - List all users
  - `GET /api/users/pending` - List pending approvals
  - `POST /api/users/{id}/approve` - Approve user
  - `DELETE /api/users/{id}` - Delete user (admin only)
- **stores.py** (291 Zeilen) - Store & Department Endpoints
  - Store CRUD operations
  - Department CRUD operations
  - Sorting & cascading deletes
- **products.py** (220 Zeilen) - Product Endpoints
  - Product CRUD operations
  - Fuzzy search functionality
- **items.py** (385 Zeilen) - Shopping List Endpoints
  - Item CRUD operations (shared list - no user ownership)
  - Smart quantity merging with date-based filtering
  - Fuzzy product matching
  - Convert item to product
  - Delete items by date (with optional store filter)
  - All authenticated users can manage the same shared list
- **pages.py** (55 Zeilen) - Static Page Serving
  - HTML page routes
  - Favicon serving

#### Architektur-Vorteile:

**Modularität:**
- Jeder Router ist eigenständig und fokussiert
- Reduzierung von [main.py](server/src/main.py) um **94%** (1475 → 92 Zeilen)
- Einfache Navigation durch klare Ordnerstruktur

**Wartbarkeit:**
- Isolierte Funktionalitäten pro Router
- Klare Verantwortlichkeiten (Single Responsibility Principle)
- Einfaches Hinzufügen neuer Endpunkte

**Dependency Flow:**
```
main.py → routers/* → schemas, utils, models → db, auth
```

**Testbarkeit:**
- Routers können isoliert getestet werden
- Mock-freundliche Dependency-Injection
- 63 Tests mit 85% Coverage

### Client-Architektur

Der Client ist in einer **vierschichtigen Architektur** mit Ordnertrennung organisiert:

#### **Data Layer** (`src/data/`)
Kernfunktionalität für Daten und Utilities:
- **api.ts** - API-Client für Shopping-List-Operationen (fetchItems, addItem, deleteItem)
- **auth.ts** - Authentifizierungs-Utilities (login, register, logout, token-management)
- **dom.ts** - DOM-Manipulations-Utilities (renderItems, loadTemplate)
- **Tests**: api.test.ts (18), auth.test.ts (36), dom.test.ts (14)

#### **State Layer** (`src/state/`)
Zentralisiertes State-Management mit reaktiven Updates (Observer Pattern):
- **shopping-list-state.ts** - Shopping-List State-Manager (Single Source of Truth)
- **store-state.ts** - Store/Product State-Manager (Geschäfte, Abteilungen, Produkte)
- **user-state.ts** - User State-Manager (Authentifizierungs-Status)
- **Features**:
  - Observer Pattern für reaktive UI-Updates
  - Loading State Tracking
  - Immutable State (gibt Kopien zurück)
  - Subscription-basierte Benachrichtigungen
  - Paralleles Laden von Daten für Performance
- **Tests**: shopping-list-state.test.ts (35), user-state.test.ts (24)

#### **UI Layer** (`src/ui/`)
Feature-spezifische UI-Logik und Event-Handler (abonniert State-Änderungen):
- **shopping-list-ui.ts** - Shopping-List UI-Logik (abonniert State, triggert Updates)
- **store-browser.ts** - Store/Product-Browser UI (Katalog-Durchsuchung, Filter, Produktauswahl)
- **user-menu.ts** - Benutzermenü-Funktionalität (abonniert User-State)

#### **Pages Layer** (`src/pages/`)
Seiten-Controller und HTML-Templates:
- **login.ts** - Login/Registrierungs-Seite Controller
- **login.html** - Login-Seite HTML-Template
- **app.html** - Hauptanwendungs HTML-Template

#### **Entry Points** (`src/`)
- **script.ts** - Haupt-App Entry-Point (initialisiert UI und State Layer)
- **index-login.ts** - Login-Seite Entry-Point

#### Architektur-Vorteile:

**Klare Schichtentrennung:**
- Data Layer kennt keine UI-Details
- State Layer verwaltet Application State (Single Source of Truth)
- UI Layer abonniert State-Änderungen für automatische Updates
- Pages Layer kombiniert UI-Module zu vollständigen Seiten

**Dependency Flow:**
```
Entry Points → Pages/UI Layer → State Layer → Data Layer
```

**Weitere Vorteile:**
- **Reaktive Updates**: UI aktualisiert sich automatisch bei State-Änderungen
- **Single Source of Truth**: Alle Komponenten teilen denselben State
- Einfache Navigation durch physische Ordnerstruktur
- Bessere Wartbarkeit und Erweiterbarkeit
- Isolierte Testbarkeit einzelner Schichten (164 Tests total)
- Wiederverwendbarkeit von Modulen
- Vermeidung von zirkulären Abhängigkeiten

Siehe [client/ARCHITECTURE.md](client/ARCHITECTURE.md) und [client/STATE_LAYER.md](client/STATE_LAYER.md) für Details.

### Projekt-Entscheidungen

1. **Bcrypt direkt statt passlib**: Kompatibilitätsgründe mit bcrypt 5.x
2. **ES2020 Module**: `.js` Extensions in Imports für Browser-Kompatibilität erforderlich
3. **localStorage für Tokens**: Einfach, aber für sensible Produktion-Anwendungen ggf. httpOnly-Cookies bevorzugen
4. **In-Memory DB für Tests**: Schnell und isoliert, keine Test-Artefakte

## Troubleshooting

### "ModuleNotFoundError: No module named 'jose'"

Lösung: Dependencies neu installieren
```powershell
pip install -e .[dev]
```

### "Cannot use import statement outside a module"

Lösung: `type="module"` im `<script>` Tag prüfen, TypeScript neu kompilieren
```powershell
cd client && npm run build
```

### "403 Forbidden" bei API-Aufrufen

Lösung: Token ist abgelaufen oder ungültig - neu anmelden

### Tests schlagen fehl

Lösung: Virtuelle Umgebung aktivieren und Dependencies prüfen
```powershell
.\venv\Scripts\Activate.ps1
pip install -e .[dev]
pytest -v
```
