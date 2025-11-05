# client_server_einkaufsliste

Python FastAPI Server + TypeScript Client mit JWT-Authentifizierung und umfassender Testabdeckung.

Eine moderne Shopping-List-Anwendung mit sicherer Benutzerauthentifizierung, persistenter Datenspeicherung, **Mengenangaben** und vollständig getesteter API.

## Features

- ✅ **JWT-Authentifizierung**: Sichere Benutzerauthentifizierung mit automatischem Token-Refresh
- ✅ **Multi-Store-Management**: Organisation nach Geschäften und Abteilungen
  - 3 vorkonfigurierte Geschäfte: Rewe, Edeka, Aldi
  - Je 9 Abteilungen pro Geschäft (z.B. "Obst & Gemüse", "Backwaren", "Milchprodukte")
  - Produktkatalog mit über 17 gängigen Produkten
  - Zuordnung von Produkten zu Geschäften und Abteilungen
  - **Produktkatalog-Browser**: Visueller Browser zum Durchsuchen und Hinzufügen von Produkten
  - **Department-Filter**: Filtern nach Abteilungen für schnelleres Finden
  - **Ein-Klick-Hinzufügen**: Produkte direkt aus dem Katalog zur Liste hinzufügen
  - Benutzerspezifische Einkaufslisten (jeder User sieht nur seine eigenen Items)
- ✅ **Mengenangaben mit Smart-Merging & Fuzzy Matching**: Optionale Mengenangaben für jeden Artikel (z.B. "500 g", "2 Stück")
  - **Kommagetrennte Eingaben**: Mehrere Mengen gleichzeitig eingeben (z.B. "2, 500 g")
  - Automatisches Summieren von Mengen mit gleicher Einheit
  - Intelligente Suche in kommagetrennte Listen
  - **Fuzzy Matching**: Ähnliche Produktnamen werden automatisch zusammengeführt
    - "Möhre" wird zu "Möhren" hinzugefügt (Singular/Plural)
    - "Moehre" wird zu "Möhren" hinzugefügt (alternative Schreibweise)
    - "Kartoffel" wird zu "Kartoffeln" hinzugefügt
  - Beispiele:
    - "Möhren 500 g" + "Möhren 300 g" = "Möhren 800 g"
    - "Zucker 500 g, 2 Packungen" + "Zucker 300 g" = "Zucker 800 g, 2 Packungen"
    - "Reis 500 g" + "2, 300 g" = "Reis 800 g, 2"
- ✅ **Reaktive UI**: Automatische UI-Updates durch State-Management mit Observer Pattern
- ✅ **Vollständige Tests**: 171 Tests (17 Server + 154 Client) mit 99%+ Code-Abdeckung
- ✅ **TypeScript Client**: Typsicherer Client mit vier-Schichten-Architektur
- ✅ **FastAPI Server**: Moderne Python API mit SQLModel ORM
- ✅ **Account-Verwaltung**: Benutzer können sich registrieren, anmelden und Account löschen

## Project Structure

```
├── server/
│   ├── src/
│   │   ├── __init__.py       # Package initialization
│   │   ├── app.py            # Simple HTTP server (stdlib)
│   │   ├── main.py           # FastAPI application
│   │   ├── models.py         # SQLModel data models (Item, Store, Department, Product)
│   │   ├── user_models.py    # User authentication models
│   │   ├── auth.py           # JWT authentication utilities
│   │   ├── db.py             # Database utilities
│   │   └── seed_data.py      # Database seed data (stores, departments, products)
│   └── tests/
│       ├── conftest.py       # Pytest fixtures
│       ├── test_api.py       # API integration tests
│       ├── test_auth.py      # Authentication tests
│       └── test_stores.py    # Store management tests
├── client/
│   ├── src/
│   │   ├── data/                 # Data layer (API, auth, DOM utilities)
│   │   │   ├── api.ts            # API client functions (items, stores, departments, products)
│   │   │   ├── api.test.ts       # API tests
│   │   │   ├── auth.ts           # Authentication utilities
│   │   │   ├── dom.ts            # DOM utilities
│   │   │   └── dom.test.ts       # DOM tests
│   │   ├── state/                # State layer (state management)
│   │   │   ├── shopping-list-state.ts      # Shopping list state manager
│   │   │   ├── shopping-list-state.test.ts # State tests
│   │   │   ├── store-state.ts              # Store/product state manager
│   │   │   ├── user-state.ts               # User state manager
│   │   │   └── user-state.test.ts          # State tests
│   │   ├── ui/                   # UI layer (feature-specific UI modules)
│   │   │   ├── shopping-list-ui.ts   # Shopping list UI module
│   │   │   ├── store-browser.ts      # Store/product browser UI module
│   │   │   └── user-menu.ts          # User menu module
│   │   ├── pages/                # Pages layer (page controllers & templates)
│   │   │   ├── login.ts          # Login page controller
│   │   │   ├── login.html        # Login HTML template
│   │   │   └── app.html          # App HTML template (with store browser)
│   │   ├── script.ts             # Main app entry point
│   │   └── index-login.ts        # Login entry point
│   ├── dist/                 # Compiled JavaScript
│   ├── index.html            # Login page
│   ├── index-app.html        # Main app page
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

Tragen Sie den generierten Key in die `.env` Datei ein:

```env
SECRET_KEY=ihr-generierter-key-hier
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**Wichtig**: Der SECRET_KEY sollte geheim bleiben und niemals in Git committet werden!

### 4. Client Build (TypeScript)

```powershell
cd client
npm install
npm run build
cd ..
```

### 5. Server starten

Mit venv:
```powershell
venv\Scripts\python.exe -m uvicorn server.src.main:app --reload --port 8000
```

Oder global (falls uvicorn installiert):
```powershell
uvicorn server.src.main:app --reload --port 8000
```

### 6. Anwendung öffnen

Öffnen Sie Ihren Browser und navigieren Sie zu: **http://localhost:8000/**

Sie sehen zuerst die Login-Seite. Registrieren Sie einen neuen Benutzer und melden Sie sich an.

### 7. Produktkatalog nutzen (Optional)

Nach dem Login können Sie den Produktkatalog verwenden:
1. Klicken Sie auf **"📖 Produktkatalog"** im Header
2. Wählen Sie ein Geschäft (z.B. "Rewe") aus dem Dropdown
3. Filtern Sie optional nach Abteilung (z.B. "Obst & Gemüse")
4. Klicken Sie auf **"+ Zur Liste"** bei Produkten, um sie hinzuzufügen
5. Die Standardeinheit wird automatisch übernommen (z.B. "kg", "Liter")

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
   - **Account löschen**: Wählen Sie "Account löschen" um Ihren Account permanent zu löschen
   - Beim Löschen wird eine Bestätigung abgefragt
   - Nach erfolgreicher Löschung wird der Token invalidiert und Sie werden zum Login weitergeleitet

### Umgebungsvariablen

| Variable | Beschreibung | Standard | Pflicht |
|----------|--------------|----------|---------|
| `SECRET_KEY` | Geheimer Schlüssel für JWT-Signierung | `dev-secret-key-change-in-production` | Ja (Produktion) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token-Gültigkeitsdauer in Minuten | `30` | Nein |
| `DATABASE_URL` | Datenbank-Verbindungs-URL | `sqlite:///./data.db` | Nein |

### Sicherheitshinweise

- **Niemals** den `SECRET_KEY` in Git committen
- In Produktion einen starken, zufälligen `SECRET_KEY` verwenden (min. 32 Bytes)
- Die `.env` Datei ist durch `.gitignore` geschützt
- Passwörter werden mit bcrypt gehasht (Salt-Runden: automatisch)
- HTTPS in Produktion verwenden für sicheren Token-Transport

### API-Endpunkte

**Authentifizierung:**
- `POST /api/auth/register` - Neuen Benutzer registrieren
- `POST /api/auth/login` - Login und Token erhalten
- `POST /api/auth/refresh` - Token erneuern (authentifiziert)
- `GET /api/auth/me` - Aktuelle Benutzerinfo abrufen (authentifiziert)
- `DELETE /api/auth/me` - Eigenen Account löschen (authentifiziert)

**Store Management (alle authentifiziert):**
- `GET /api/stores` - Alle Geschäfte abrufen
- `GET /api/stores/{store_id}/departments` - Abteilungen eines Geschäfts
- `GET /api/stores/{store_id}/products` - Alle Produkte eines Geschäfts
- `GET /api/departments/{department_id}/products` - Produkte einer Abteilung

**Shopping List (alle authentifiziert, benutzerspezifisch):**
- `GET /api/items` - Alle Artikel des aktuellen Benutzers abrufen
- `POST /api/items` - Neuen Artikel erstellen oder Menge aktualisieren
  - Body: `{"name": "Artikelname", "menge": "500 g"}` (menge ist optional)
  - Beispiele:
    - `{"name": "Möhren", "menge": "500 g"}`
    - `{"name": "Milch"}` (ohne Menge)
    - `{"name": "Reis", "menge": "2, 500 g"}` (kommagetrennte Eingabe)
  - **Smart-Merging mit Einheiten-Suche & Fuzzy Matching**: Wenn ein Artikel bereits existiert oder ähnlich ist:
    - **Benutzerspezifisch**: Nur eigene Items werden berücksichtigt
    - **Fuzzy Matching**: Ähnliche Namen werden erkannt ("Möhre" → "Möhren", "Moehre" → "Möhren")
    - **Kommagetrennte Eingaben**: Mehrere Mengen werden separat verarbeitet ("2, 500 g" → ["2", "500 g"])
    - Gleiche Einheit → Mengen werden summiert (z.B. "500 g" + "300 g" = "800 g")
    - Verschiedene Einheiten → Als kommagetrennte Liste gespeichert (z.B. "500 g" + "2 Packungen" = "500 g, 2 Packungen")
    - Einheit in Liste vorhanden → Nur diese Einheit wird summiert (z.B. "500 g, 2 Packungen" + "300 g" = "800 g, 2 Packungen")
    - Keine Einheit → Zahlen werden summiert (z.B. "6" + "12" = "18")
- `DELETE /api/items/{id}` - Eigenen Artikel löschen (nur eigene Items)

## Code-Qualität

### Formatierung mit Black

```powershell
black server/
```

Black formatiert den Python-Code automatisch nach PEP 8 Standards.

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
- ✅ 27 Tests insgesamt
- ✅ **Authentifizierung** (10 Tests):
  - Registrierung, Login, Token-Validierung, Token-Refresh, Account-Löschung
- ✅ **Shopping-List CRUD** (10 Tests):
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
  - **Benutzerspezifisch**: Jeder User sieht nur seine eigenen Items
- ✅ **Store Management** (7 Tests):
  - Stores, Departments und Products abrufen
  - Beziehungen zwischen Stores, Departments und Products
  - Fehlerbehandlung für nicht existierende Ressourcen
  - Authentifizierungsschutz für alle Endpoints
- ✅ Geschützte Endpunkte (401/403 Tests)
- ✅ User-Verwaltung (Account-Löschung, Token-Invalidierung)
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
- ✅ 154 Tests insgesamt (10 Test-Suites)
- ✅ 99.36% Code-Abdeckung
- ✅ Data Layer: API Client (19), Authentication (36), DOM (15) = 70 Tests
  - Inklusive 401 Handling & Token Refresh Failures
  - Inklusive Token-Refresh-Optimierung (Singleton, Cooldown, Concurrent Requests)
  - Inklusive Template-Caching (Memory Cache, Load Flag, Zero Network Cost)
  - Inklusive DOM-Batching (DocumentFragment, O(1) Reflows)
  - **Neu**: Tests für Mengenangaben in API und DOM
- ✅ State Layer: Shopping List State (36), User State (24) = 60 Tests
  - Inklusive Observer Pattern, Subscriptions, Reactivity
  - Inklusive Loading State Tracking
  - Inklusive Immutability Tests
  - **Neu**: Tests für Mengenangaben im State
  - **Neu**: Test für Fuzzy-Matching-Update (verhindert Duplikate)
- ✅ UI Layer: Shopping List UI (16), User Menu (16) = 32 Tests
  - **Neu**: Tests für Mengenfeld-Eingabe
- ✅ Pages Layer: Login Controller (20) = 20 Tests
- ✅ Entry Points: Login Entry (4), Main App Entry (7) = 11 Tests
- ✅ Error Handling, Edge Cases, User Interactions

### Continuous Integration (CI)

Das Projekt nutzt GitHub Actions für automatisierte Tests bei jedem Push/Pull Request:

**Server Tests (Python):**
- Black Code-Formatierung prüfen
- Flake8 Linting
- Pytest Tests (15 Tests)

**Client Tests (TypeScript):**
- TypeScript Build
- Jest Tests (154 Tests, 99.36% Coverage)

Beide Jobs laufen parallel für maximale Geschwindigkeit. Die CI-Konfiguration befindet sich in `.github/workflows/ci.yml`.

## Entwickler-Notizen

### Datenbank

- SQLite wird für lokale Entwicklung verwendet
- Datenbank-Datei: `data.db` (wird automatisch erstellt)
- Schema wird beim ersten Start automatisch erstellt
- **Automatisches Seeding**: Beim ersten Start werden Beispieldaten geladen:
  - 3 Geschäfte: Rewe, Edeka, Aldi
  - 27 Abteilungen (9 pro Geschäft)
  - 17 Produkte für Rewe
- **Datenbankschema**:
  - `user` - Benutzerkonten
  - `store` - Geschäfte
  - `department` - Abteilungen (mit Foreign Key zu store)
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
