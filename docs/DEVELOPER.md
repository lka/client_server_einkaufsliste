# Developer Documentation

Technische Dokumentation für Entwickler der Client/Server Einkaufsliste.

> **Hinweis:** Für Feature-Beschreibungen und Benutzer-Informationen siehe [README.md](../README.md)
>
> **📚 Alle Dokumentationen:** Siehe [Dokumentations-Index](INDEX.md)

## Inhaltsverzeichnis

- [Project Structure](#project-structure)
- [Installation & Entwicklung](#installation--entwicklung)
- [API-Endpunkte](#api-endpunkte)
- [Code-Qualität](#code-qualität)
- [Testing](#testing)
- [Architektur](#architektur)
- [Troubleshooting](#troubleshooting)

---

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
│   │   ├── websocket_manager.py  # WebSocket connection management
│   │   └── routers/          # API routers (modular endpoint organization)
│   │       ├── __init__.py   # Router package initialization
│   │       ├── auth.py       # Authentication endpoints (register, login, /me, refresh)
│   │       ├── users.py      # User management endpoints (list, approve)
│   │       ├── stores.py     # Store & department endpoints (CRUD, sorting)
│   │       ├── products.py   # Product endpoints (CRUD, fuzzy search)
│   │       ├── items.py      # Shopping list item endpoints (CRUD, smart merging)
│   │       ├── templates.py  # Template endpoints (CRUD)
│   │       ├── weekplan.py   # Weekplan endpoints (CRUD, template integration)
│   │       ├── backup.py     # Database backup & restore endpoints
│   │       └── pages.py      # Static page serving endpoints (HTML pages)
│   └── tests/
│       ├── conftest.py              # Pytest fixtures
│       ├── test_api.py              # API integration tests (21 tests)
│       ├── test_auth.py             # Authentication tests (10 tests)
│       ├── test_stores.py           # Store/Department/Product CRUD tests (31 tests)
│       ├── test_user_management.py  # User management tests (10 tests)
│       └── test_weekplan.py         # Weekplan & template integration tests (6 tests)
├── client/
│   ├── src/
│   │   ├── data/                 # Data layer (API, auth, DOM utilities, WebSocket, Inactivity)
│   │   │   ├── api.ts            # API barrel file (re-exports from api/ modules)
│   │   │   ├── api/              # Modular API client (13 modules)
│   │   │   │   ├── index.ts      # Barrel file - exports all API modules
│   │   │   │   ├── types.ts      # Shared TypeScript types and API endpoints
│   │   │   │   ├── utils.ts      # Auth headers, token refresh, error handling
│   │   │   │   ├── items-api.ts  # Shopping list items operations
│   │   │   │   ├── stores-api.ts # Stores and departments CRUD
│   │   │   │   ├── products-api.ts # Product catalog operations
│   │   │   │   ├── users-api.ts  # User management operations
│   │   │   │   ├── templates-api.ts # Shopping template operations
│   │   │   │   ├── weekplan-api.ts # Weekplan and known units operations
│   │   │   │   ├── recipes-api.ts # Recipe search and retrieval
│   │   │   │   ├── backup-api.ts # Database backup and restore
│   │   │   │   ├── webdav-api.ts # WebDAV settings and recipe import
│   │   │   │   └── config-api.ts # Server configuration and version
│   │   │   ├── auth.ts           # Authentication utilities (RefreshResult, Retry-Logik, expires_in)
│   │   │   ├── dom.ts            # DOM utilities
│   │   │   ├── dom.test.ts       # DOM tests
│   │   │   ├── websocket.ts      # WebSocket connection manager
│   │   │   ├── websocket.test.ts # WebSocket tests (12 tests)
│   │   │   └── inactivity-tracker.ts # Inactivity tracking with auto-logout
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
│   │   │   │   ├── autocomplete.ts   # Autocomplete component
│   │   │   │   ├── datepicker.ts     # DatePicker component with shopping day visualization
│   │   │   │   ├── menu-dropdown.html # Centralized menu template (loaded dynamically)
│   │   │   │   └── index.ts      # Component library exports & initialization
│   │   │   ├── print-utils.ts    # Print functionality (platform-specific)
│   │   │   ├── print-debug.ts    # Debug console for print (optional, loaded dynamically)
│   │   │   ├── shopping-list-ui.ts   # Shopping list UI module
│   │   │   ├── store-browser.ts      # Store/product browser UI module
│   │   │   ├── store-admin.ts        # Store administration UI (CRUD)
│   │   │   ├── product-admin.ts      # Product administration UI (CRUD)
│   │   │   ├── user-admin.ts         # User administration UI (approval)
│   │   │   ├── template-admin.ts     # Template administration UI (CRUD)
│   │   │   ├── weekplan.ts           # Weekplan UI module (228 lines, refactored - uses weekplan/ modules)
│   │   │   ├── weekplan/             # Weekplan modular components (13 modules)
│   │   │   │   ├── index.ts          # Barrel file - exports all modules
│   │   │   │   ├── types.ts          # Shared TypeScript types
│   │   │   │   ├── weekplan-state.ts # State management with Observer pattern
│   │   │   │   ├── weekplan-utils.ts # Date utility functions
│   │   │   │   ├── weekplan-navigation.ts # Week navigation logic
│   │   │   │   ├── weekplan-websocket.ts # WebSocket integration
│   │   │   │   ├── weekplan-print.ts # Print functionality
│   │   │   │   ├── weekplan-rendering.ts # DOM rendering
│   │   │   │   ├── entry-input.ts    # Entry input with autocomplete
│   │   │   │   ├── ingredient-parser.ts # Quantity parsing
│   │   │   │   ├── template-modal.ts # Template details modal
│   │   │   │   ├── recipe-modal.ts   # Recipe details modal
│   │   │   │   └── modal-shared.ts   # Shared modal components
│   │   │   └── user-menu.ts          # User menu module
│   │   ├── state/                # State layer (state management)
│   │   │   ├── shopping-list-state.ts      # Shopping list state manager
│   │   │   ├── shopping-list-state.test.ts # State tests
│   │   │   ├── store-state.ts              # Store/product state manager
│   │   │   ├── user-state.ts               # User state manager
│   │   │   └── user-state.test.ts          # State tests
│   │   ├── pages/                # Pages layer (page controllers & templates)
│   │   │   ├── login.ts          # Login page controller
│   │   │   ├── login.html        # Login HTML template
│   │   │   ├── app.html          # App HTML template (with store browser)
│   │   │   ├── stores.html       # Store admin HTML template
│   │   │   ├── products.html     # Product admin HTML template
│   │   │   ├── users.html        # User admin HTML template
│   │   │   ├── templates.html    # Template admin HTML template
│   │   │   ├── weekplan.html     # Weekplan HTML template
│   │   │   └── backup.html       # Backup admin HTML template
│   │   ├── script.ts             # Main app entry point
│   │   ├── script-stores.ts      # Store admin entry point
│   │   ├── script-products.ts    # Product admin entry point
│   │   ├── script-users.ts       # User admin entry point
│   │   ├── script-templates.ts   # Template admin entry point
│   │   ├── script-weekplan.ts    # Weekplan entry point
│   │   ├── script-backup.ts      # Backup admin entry point
│   │   └── index-login.ts        # Login entry point
│   ├── dist/                 # Compiled JavaScript
│   ├── index.html            # Login page
│   ├── index-app.html        # Main app page
│   ├── index-stores.html     # Store admin page
│   ├── index-products.html   # Product admin page
│   ├── index-users.html      # User admin page
│   ├── index-templates.html  # Template admin page
│   ├── index-weekplan.html   # Weekplan page
│   ├── index-backup.html     # Backup admin page
│   ├── favicon.svg           # Application icon
│   ├── styles.css            # Styles
│   ├── package.json          # Node dependencies
│   ├── tsconfig.json         # TypeScript config
│   └── jest.config.js        # Jest config
├── .env.example              # Environment variables template
├── .env                      # Environment variables (not in git)
└── pyproject.toml            # Python project config
```

## Installation & Entwicklung

### Voraussetzungen

- Python 3.13+ (empfohlen) oder Python 3.10+
- Node.js 16+ für TypeScript/Client-Build

### 1. Virtuelle Umgebung erstellen

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 2. Python-Abhängigkeiten installieren

**Für Entwickler (empfohlen):**
```bash
pip install -e .[dev]
```

**Oder nur Production-Dependencies:**
```bash
pip install -e .
```

**Production Dependencies:**
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `sqlmodel` - SQL database ORM (basiert auf SQLAlchemy + Pydantic)
- `python-jose[cryptography]` - JWT token creation/validation
- `bcrypt` - Password hashing
- `python-multipart` - Form data parsing
- `python-readenv` - Environment variable loading

**Development Dependencies (nur mit `.[dev]`):**
- `pytest` - Testing framework
- `pytest-cov` - Coverage plugin für pytest
- `black` - Code formatter
- `flake8` - Linter
- `httpx` - HTTP client für Tests
- `pre-commit` - Git hooks für Code-Qualität

### 3. Umgebungsvariablen konfigurieren

Kopiere `.env.example` zu `.env` und passe die Werte an:

```bash
cp .env.example .env
```

**Wichtige Umgebungsvariablen:**

```bash
# JWT Secret - WICHTIG: Ändere dies in Produktion!
SECRET_KEY=your-secret-key-here-change-in-production

# Token Gültigkeit (in Minuten)
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_MINUTES=10080  # 7 Tage

# Administratorpasswort für ersten Setup
# Wird nur beim ersten Start verwendet, um Admin-User zu erstellen
ADMIN_PASSWORD=admin123

# Datenbank-Konfiguration
# SQLite Datenbankpfad
DATABASE_URL=sqlite:///./data.db

# WebSocket-Konfiguration
WEBSOCKET_HEARTBEAT_INTERVAL=30

# Datenbereinigung (in Tagen)
# Nicht genehmigte Benutzer, die länger als diese Anzahl an Tagen inaktiv sind, werden gelöscht
DELETE_UNAPPROVED_AFTER_DAYS=30
# Einkaufslisteneinträge, deren shopping_date älter ist als diese Anzahl an Tagen, werden gelöscht
DELETE_ITEMS_AFTER_DAYS=90

# Shopping Day Configuration (0=Monday, 6=Sunday)
MAIN_SHOPPING_DAY=2        # Wednesday
FRESH_PRODUCTS_DAY=4       # Friday
```

### 4. Client Build (TypeScript)

```bash
cd client
npm install
npm run build   # Kompiliert TypeScript zu JavaScript
```

**NPM Scripts:**
- `npm run build` - TypeScript kompilieren
- `npm test` - Tests ausführen
- `npm run test:coverage` - Tests mit Coverage-Report

### 5. Server starten

**Option A: Entwicklungsserver (mit Auto-Reload)**
```bash
# Von Projektroot
python -m uvicorn server.src.main:app --reload --port 8000
```

**Option B: Produktionsserver**
```bash
python server/src/app.py
```

Der Server läuft auf `http://localhost:8000`

**Server-Features beim Start:**
- Automatische Datenbank-Initialisierung (data.db)
- Admin-User wird erstellt (Username: `admin`, Passwort aus `.env`)
- Seed-Daten werden geladen (Stores, Departments, Products)
- Alte Daten werden bereinigt (nicht genehmigte User, alte Items)
- WebSocket-Verbindungen werden akzeptiert

### 6. Anwendung öffnen

Öffne im Browser: `http://localhost:8000`

**Erste Schritte:**
1. Login mit Admin-Credentials (Username: `admin`, Passwort aus `.env`)
2. Oder: Neuen Benutzer registrieren (muss von Admin genehmigt werden)
3. Nach Login: Shopping-Liste verwenden

**Verfügbare Seiten:**
- `/` - Login/Registrierung
- `/app` - Einkaufsliste
- `/stores` - Geschäfte verwalten (Admin UI)
- `/products` - Produkte verwalten (Admin UI)
- `/users` - Benutzer verwalten (Admin UI)
- `/templates` - Vorlagen verwalten
- `/weekplan` - Wochenplan
- `/backup` - Datenbank-Backup & Restore

---

## API-Endpunkte

Die API verwendet JWT-Token für Authentifizierung. Alle Endpunkte außer `/register` und `/token` erfordern einen gültigen Access-Token im Authorization-Header:

```
Authorization: Bearer <access_token>
```

**Wichtigste Endpunkte:**
- `POST /register` - Benutzerregistrierung
- `POST /token` - Login (erhält Access + Refresh Token)
- `POST /refresh` - Token erneuern
- `GET /me` - Aktueller Benutzer
- `GET /api/items` - Einkaufsliste abrufen
- `POST /api/items` - Item hinzufügen
- `DELETE /api/items/{id}` - Item löschen
- `GET /api/templates` - Vorlagen abrufen
- `GET /api/weekplan/entries` - Wochenplan-Einträge abrufen
- `GET /api/backup` - Datenbank-Backup erstellen
- `POST /api/restore` - Datenbank wiederherstellen

WebSocket-Endpunkt:
- `WS /ws/{client_id}` - WebSocket-Verbindung für Live-Updates

---

## Code-Qualität

### Formatierung mit Black

Automatische Code-Formatierung für Python:

```bash
# Gesamtes Projekt formatieren
black .

# Nur Server-Code
black server/

# Check-only (keine Änderungen)
black --check server/
```

**Black-Konfiguration:**
- Line length: 88 (default)
- String normalization: enabled
- Target version: Python 3.10+

### Linting mit Flake8

Code-Qualitätsprüfung:

```bash
flake8 server/
```

Konfiguration in `pyproject.toml`.

---

## Testing

### Server Tests (Python/pytest)

**Alle Tests ausführen:**
```bash
pytest server/tests/ -v
```

**Mit Coverage-Report:**
```bash
pytest server/tests/ --cov=server.src --cov-report=html
```

**Einzelne Test-Dateien:**
```bash
pytest server/tests/test_api.py -v
pytest server/tests/test_auth.py -v
pytest server/tests/test_stores.py -v
pytest server/tests/test_user_management.py -v
pytest server/tests/test_weekplan.py -v
```

**Test-Struktur:**
- ✅ **78 Tests insgesamt** (85%+ Code-Coverage)
- **Authentifizierung** (10 Tests): Registrierung, Login, Token-Validierung, Refresh
- **Shopping-List CRUD** (21 Tests): Item-Operationen, Fuzzy-Matching, Mengenlogik
- **Store-Management** (31 Tests): Stores, Departments, Products, Sorting
- **User-Management** (10 Tests): Genehmigung, Account-Löschung
- **Wochenplan & Template-Integration** (6 Tests): CRUD, automatische Einkaufslisten-Generierung

**Test-Features:**
- Isolierte Test-Datenbank (in-memory SQLite)
- Automatische Cleanup nach jedem Test
- Fixtures für User, Stores, Products
- Async-Test-Support

### Client Tests (TypeScript/Jest)

**Alle Tests ausführen:**
```bash
cd client
npm test
```

**Mit Coverage:**
```bash
npm run test:coverage
```

**Watch-Mode (TDD):**
```bash
npm run test:watch
```

**Test-Struktur:**
- ✅ **462 Tests insgesamt** (85%+ Coverage)
- **Data Layer Tests** (84): API, Auth (inkl. Retry-Logik), DOM, WebSocket
- **UI Component Tests** (320): Button, Modal, Card, Input, Dropdown, DatePicker, etc.
- **State Layer Tests** (38): Shopping-List State, User State
- **Pages Layer Tests** (20): Login Controller

**Test-Features:**
- DOM Mocking mit jsdom
- Fetch Mocking für API-Calls
- WebSocket Mocking
- LocalStorage/SessionStorage Mocking
- Coverage-Reports (HTML + LCOV)

### Continuous Integration (CI)

**GitHub Actions Workflow:**
- Automatische Tests bei Push/PR
- Python 3.10, 3.11, 3.12, 3.13
- Node.js 16, 18, 20
- Coverage-Upload zu Codecov (optional)

**Workflow-Schritte:**
1. Checkout code
2. Setup Python + Node.js
3. Install dependencies
4. Run linters (black, flake8)
5. Run tests (pytest + jest)
6. Generate coverage reports
7. Upload coverage (optional)

---

## Architektur

### Technologie-Stack

**Backend:**
- **FastAPI** - Modern Python web framework with automatic OpenAPI
- **SQLModel** - SQL ORM (SQLAlchemy + Pydantic integration)
- **SQLite** - File-based SQL database
- **JWT** - Stateless authentication
- **WebSocket** - Real-time bidirectional communication
- **Uvicorn** - Lightning-fast ASGI server

**Frontend:**
- **TypeScript** - Type-safe JavaScript
- **Native DOM API** - No framework overhead
- **CSS3** - Modern styling with CSS Variables
- **WebSocket API** - Real-time updates
- **Jest** - Testing framework

### Server-Architektur

#### **Kern-Module** (`src/`)
- **main.py** - FastAPI app initialization, CORS, routers, lifecycle events
- **models.py** - SQLModel data models (Item, Store, Department, Product, Template, WeekplanEntry)
- **auth.py** - JWT utilities (token creation, verification, password hashing)
- **db.py** - Database initialization, session management
- **utils.py** - Helper functions (quantity parsing, fuzzy matching, date calculation)
- **websocket_manager.py** - WebSocket connection management, broadcasting

#### **API Routers** (`src/routers/`)

Modulare Organisation der API-Endpunkte:

- **auth.py** - Authentication (register, login, token refresh, /me)
- **users.py** - User management (list, approve, delete)
- **stores.py** - Store & department CRUD + sorting
- **products.py** - Product CRUD + fuzzy search
- **items.py** - Shopping list items CRUD + smart merging
- **templates.py** - Template CRUD
- **weekplan.py** - Weekplan CRUD + template integration
- **backup.py** - Database backup & restore
- **pages.py** - Static HTML page serving

**Architektur-Vorteile:**
- **Separation of Concerns**: Jeder Router hat klare Verantwortlichkeit
- **Wiederverwendbare Utilities**: Gemeinsame Funktionen in utils.py
- **Konsistente Error-Handling**: HTTPException in allen Routern
- **Type Safety**: Pydantic schemas für Request/Response-Validierung
- **Auto-Documentation**: FastAPI generiert automatisch OpenAPI/Swagger-Docs

**API-Design-Patterns:**
- RESTful URLs (`/api/items`, `/api/stores/{id}`)
- Konsistente Response-Struktur (Pydantic models)
- JWT in Authorization header
- WebSocket für Real-time Updates

### Client-Architektur

**3-Layer Architecture: Data → State → UI**

#### **Data Layer** (`src/data/`)
Kümmert sich um externe Datenquellen:
- **api.ts** - API barrel file (re-exports from api/ modules for backward compatibility)
- **api/** - Modular API client (13 modules):
  - **index.ts** - Barrel file for all API exports
  - **types.ts** - Shared TypeScript interfaces and API endpoint constants
  - **utils.ts** - Authentication headers, token refresh, error handling utilities
  - **items-api.ts** - Shopping list items operations (fetch, add, delete, convert)
  - **stores-api.ts** - Stores and departments CRUD + sorting operations
  - **products-api.ts** - Product catalog operations (CRUD, autocomplete, search)
  - **users-api.ts** - User management operations (list, approve, delete)
  - **templates-api.ts** - Shopping template operations (CRUD)
  - **weekplan-api.ts** - Weekplan entries and known units operations
  - **recipes-api.ts** - Recipe search and retrieval operations
  - **backup-api.ts** - Database backup creation and restore
  - **webdav-api.ts** - WebDAV settings and recipe import operations
  - **config-api.ts** - Server configuration and version info
- **auth.ts** - Token management, login/logout/register, RefreshResult-Typ mit Retry-Logik (exponentielles Backoff)
- **websocket.ts** - WebSocket connection manager mit Auto-Reconnect
- **dom.ts** - DOM manipulation utilities
- **inactivity-tracker.ts** - Inaktivitäts-Tracking für Auto-Logout

#### **State Layer** (`src/state/`)
Verwaltet Application State:
- **shopping-list-state.ts** - State für Einkaufsliste (Items, Store-Filter)
- **store-state.ts** - State für Stores/Departments/Products
- **user-state.ts** - State für User (current user, approval status)

#### **UI Layer** (`src/ui/`)
UI-Module und Komponenten:
- **components/** - Wiederverwendbare UI-Komponenten (Button, Modal, Input, etc.)
- **shopping-list-ui.ts** - Shopping list rendering & interactions
- **store-admin.ts** - Store/Department admin UI
- **product-admin.ts** - Product admin UI
- **user-admin.ts** - User approval UI
- **template-admin.ts** - Template CRUD UI with product autocomplete
- **weekplan.ts** - Weekplan UI (228 lines, refactored)
- **weekplan/** - Modular weekplan components (13 modules):
  - **index.ts** - Barrel file for all exports
  - **types.ts** - Shared types and constants
  - **weekplan-state.ts** - State management with Observer pattern
  - **weekplan-utils.ts** - Date utility functions
  - **weekplan-navigation.ts** - Week navigation logic
  - **weekplan-websocket.ts** - WebSocket integration
  - **weekplan-print.ts** - Print functionality
  - **weekplan-rendering.ts** - DOM rendering
  - **entry-input.ts** - Entry input with autocomplete
  - **ingredient-parser.ts** - Quantity parsing and scaling
  - **template-modal.ts** - Template details with delta management
  - **recipe-modal.ts** - Recipe details with ingredient management
  - **modal-shared.ts** - Shared modal UI components
- **print-utils.ts** - Print functionality

#### **Pages Layer** (`src/pages/`)
Page controllers und HTML templates:
- **login.ts** - Login page controller
- **login.html** - Login HTML template
- **app.html**, **stores.html**, **products.html**, etc.

#### **Entry Points** (`src/`)
- **script.ts** - Main app entry point
- **script-stores.ts**, **script-products.ts**, etc. - Admin page entry points
- **index-login.ts** - Login page entry point

**Architektur-Vorteile:**
- **Klare Separation**: Data, State, UI haben eigene Verantwortlichkeiten
- **Testbarkeit**: Jede Schicht kann isoliert getestet werden
- **Wiederverwendbarkeit**: Components können in verschiedenen UI-Modulen genutzt werden
- **Maintainability**: Änderungen an einer Schicht beeinflussen andere nicht
- **Type Safety**: TypeScript in allen Schichten

### Refactoring-Erfolge

Das Projekt hat zwei große Refactorings durchlaufen, um die Code-Komplexität zu reduzieren:

#### 1. API Modular Refactoring (Abgeschlossen)
- **Vorher**: Eine Datei (api.ts) mit 1,722 Zeilen, McCabe 317
- **Nachher**: 13 fokussierte Module in `client/src/data/api/`
- **Ergebnis**:
  - Durchschnittliche Modul-Komplexität: ~25 McCabe (manageable)
  - Vollständige Rückwärtskompatibilität
  - Bessere Organisation und Wartbarkeit
- **Module**: types.ts, utils.ts, items-api.ts, stores-api.ts, products-api.ts, users-api.ts, templates-api.ts, weekplan-api.ts, recipes-api.ts, backup-api.ts, webdav-api.ts, config-api.ts, index.ts

#### 2. Weekplan Modular Refactoring (Abgeschlossen)
- **Vorher**: Eine Datei (weekplan.ts) mit ~850 Zeilen, McCabe 251
- **Nachher**: Hauptdatei 228 Zeilen (McCabe 35) + 13 fokussierte Module in `client/src/ui/weekplan/`
- **Ergebnis**:
  - **73% Reduzierung** der Hauptdatei
  - Von "sehr hoher Komplexität" zu "hoher Komplexität" (manageable)
  - Durchschnittliche Modul-Komplexität: ~20 McCabe
  - Vollständige Rückwärtskompatibilität
  - Alle Features durch modulare Komposition erhalten
- **Module**: types.ts, weekplan-state.ts, weekplan-utils.ts, weekplan-navigation.ts, weekplan-websocket.ts, weekplan-print.ts, weekplan-rendering.ts, entry-input.ts, ingredient-parser.ts, template-modal.ts, recipe-modal.ts, modal-shared.ts, index.ts

**Gesamt-Verbesserungen**:
- **68 TypeScript-Dateien** analysiert
- **13,071 Zeilen Code** insgesamt
- **Durchschnittliche Komplexität**: 20.94 McCabe (war 33.31)
- **Durchschnittliche zyklomatische Komplexität**: 21.84 (war 35.17)
- **Durchschnittliche McCabe-Komplexität**: 31.07 (war 49.60)

Weitere Details siehe [client/ARCHITECTURE.md](../client/ARCHITECTURE.md) und [client/src/ui/weekplan/README.md](../client/src/ui/weekplan/README.md).

### Entwickler-Notizen

#### Datenbank

**SQLite:**
- Datei: `data.db` (im Projektroot)
- Auto-created beim ersten Start
- Migrations: Keine (SQLModel erstellt Tabellen automatisch)

**Schema:**
- `users` - Benutzer (username, hashed_password, is_approved)
- `stores` - Geschäfte (name, sort_order)
- `departments` - Abteilungen (name, store_id, sort_order)
- `products` - Produkte (name, store_id, department_id, fresh)
- `items` - Shopping-List-Items (name, menge, store_id, product_id, department_id, shopping_date)
- `shoppingtemplates` - Vorlagen (name, description)
- `templateitems` - Vorlagen-Items (template_id, name, menge)
- `weekplanentries` - Wochenplan (date, meal, text)

**Beziehungen:**
- Store → Departments (1:n)
- Store → Products (1:n)
- Department → Products (1:n)
- Product → Items (1:n, optional)
- Template → TemplateItems (1:n)

### Projekt-Entscheidungen

**Warum TypeScript ohne Framework?**
- Schneller als React/Vue/Angular
- Weniger Overhead, kleinere Bundle-Size
- Direkter DOM-Zugriff, volle Kontrolle
- Einfacher zu testen (weniger Abstraktion)
- Keine Framework-Lock-in

**Warum SQLite?**
- Einfaches Setup (keine Installation nötig)
- Perfekt für kleine bis mittlere Anwendungen
- ACID-Transaktionen
- SQL-Queries möglich
- Easy Backup (Datei kopieren)

**Warum WebSocket?**
- Real-time Updates ohne Polling
- Bidirektionale Kommunikation
- Effizient (persistente Verbindung)
- Standardisiert (WebSocket API)

**Warum JWT?**
- Stateless (kein Session-Store nötig)
- Skalierbar (Token enthält alle Infos)
- Sicher (signiert mit SECRET_KEY)
- Standard (viele Libraries)

---

## Troubleshooting

### "ModuleNotFoundError: No module named 'jose'"

**Problem:** python-jose ist nicht installiert oder falsche Version.

**Lösung:**
```bash
pip install python-jose[cryptography]
```

### "Cannot use import statement outside a module"

**Problem:** TypeScript wurde nicht kompiliert.

**Lösung:**
```bash
cd client
npm run build
```

### "403 Forbidden" bei API-Aufrufen

**Problem:** Token ist abgelaufen oder ungültig.

**Lösung:**
- Neu einloggen
- Token-Refresh nutzen
- `ACCESS_TOKEN_EXPIRE_MINUTES` in `.env` erhöhen (nur für Development!)

### Tests schlagen fehl

**Problem:** Dependencies fehlen oder Datenbank-Konflikte.

**Lösung:**
```bash
# Python
pip install -e .
pytest server/tests/ -v

# Client
cd client
npm install
npm test
```

### WebSocket-Verbindung schlägt fehl

**Problem:** Server läuft nicht oder Port ist blockiert.

**Lösung:**
- Server neu starten
- Port 8000 freigeben
- CORS-Settings in main.py prüfen

### "Database is locked"

**Problem:** SQLite wird von anderem Prozess verwendet.

**Lösung:**
- Alle Server-Prozesse beenden
- `data.db-journal` löschen (falls vorhanden)
- Server neu starten

---

## Weiterführende Links

- [FastAPI Dokumentation](https://fastapi.tiangolo.com/)
- [SQLModel Dokumentation](https://sqlmodel.tiangolo.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Jest Dokumentation](https://jestjs.io/docs/getting-started)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
