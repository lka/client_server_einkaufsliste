# Claude Code Arbeitsanweisungen

## 🎯 Projektüberblick

Einkaufslisten-Verwaltung mit Client-Server-Architektur:
- **Server**: Python FastAPI mit SQLModel/SQLAlchemy, WebSocket-Support
- **Client**: TypeScript Vanilla JS (kein Framework), 4-Schichten-Architektur
- **Datenbank**: SQLite
- **Deployment**: Docker mit Traefik Reverse Proxy

## 📚 Dokumentation

**Vor jeder Änderung relevante Dokumentation lesen:**

- **Architektur**: [docs/client/ARCHITECTURE.md](docs/client/ARCHITECTURE.md) - Client 4-Schichten-Architektur
- **Server**: [docs/DEVELOPER.md](docs/DEVELOPER.md) - Server-API und Datenbankschema
- **Features**: [docs/FEATURES.md](docs/FEATURES.md) - Alle Features und deren Funktionsweise
- **Releases**: [docs/RELEASES.md](docs/RELEASES.md) - Überblick über die Versionen und deren Ziel
- **Code-Qualität**: [docs/COMPLEXITY.md](docs/COMPLEXITY.md) - Komplexitätsziele und Refactoring-Historie
- **Vollständiger Index**: [docs/INDEX.md](docs/INDEX.md)

## 🏗️ Architektur-Richtlinien

### Client (TypeScript)

**4-Schichten-Architektur strikt einhalten:**
1. **UI Layer** (`src/ui/`): DOM-Manipulation, Event-Handler, Rendering
2. **State Layer** (`src/state/`): Zentraler App-State, Observer Pattern
3. **Data Layer** (`src/data/`): API-Aufrufe, Daten-Transformation
4. **Network Layer** (`src/network/`): HTTP-Client, WebSocket

**Wichtige Regeln:**
- ✅ Bestehende Komponenten nutzen: `client/src/ui/components/` (buttons, inputs, modals)
- ✅ State Management immer über State Layer, nie direkter DOM-State
- ✅ API-Aufrufe nur über Data Layer (`src/data/api.ts`)
- ✅ WebSocket nur über `src/data/websocket.ts`
- ❌ Keine UI-Frameworks (Vanilla JS/TypeScript, kein React/Vue/Angular)
- ❌ Keine direkten API-Aufrufe aus UI-Komponenten
- ❌ **`client/package.json` version nicht ändern**

**Modularisierung:** Dateien > 200 Zeilen oder McCabe > 50 → Unterverzeichnis mit `index.ts` als Public API, Backward Compatibility durch Re-Exports.

### Server (Python)

**Struktur:**
- `server/src/routers/`: API-Endpunkte nach Ressourcen gruppiert
- `server/src/models.py`: SQLModel Datenbank-Modelle
- `server/src/dependencies.py`: Dependency Injection (DB-Sessions, Auth)

**Wichtige Regeln:**
- ✅ Fuzzy Matching: `_find_item_by_match_strategy()` aus `items.py` nutzen (Exact Match bei Produktliste, sonst Fuzzy 80%)
- ✅ Type Safety: Pydantic/SQLModel für Validierung
- ❌ Keine zirkulären Imports
- ❌ **`server/src/version.py` nicht ändern**

## 🎨 UI/UX Richtlinien

### Print-Layout (Einkaufsliste)
- Format: DIN A4 quer, 4 Spalten, Rand 1 cm außen, Spalten-Abstand 1 cm
- Duplex: Wenden über kurze Seite

### Standard-Patterns
- **Datum**: ISO 8601 (YYYY-MM-DD) im Backend, DE-Format (DD.MM.YYYY) im UI
- **Fehlerbehandlung**: Modals für User-Feedback, Console für Debug
- **Loading States**: Während API-Aufrufen anzeigen

## 💻 Betriebssystem & Shell

**Windows 11 — immer PowerShell verwenden:**
- ❌ Kein `Bash`-Tool für Shell-Befehle
- ✅ Ausschließlich `PowerShell`-Tool verwenden
- Pfadtrenner: `\` (Backslash), keine POSIX-Pfade
- Umgebungsvariablen: `$env:VAR`, nicht `$VAR` oder `export VAR=`
- Python-Pfade: `..\venv\Scripts\python.exe` (relativ) oder absolut mit `\`

## 📊 Code-Qualität

### Komplexitätsziele
- **McCabe-Komplexität**: Ziel ≤ 50 pro Datei, ideal < 30
- **Dateigröße**: ≤ 200 Zeilen

### Bei Änderungen
```powershell
# TypeScript kompilieren
cd client; npx tsc --noEmit

# Complexity Report (Client)
cd client; npm run complexity

# Complexity Report (Server)
cd server; ..\venv\Scripts\python.exe run-complexity.py

# Python Tests (im venv)
cd server; ..\venv\Scripts\python.exe -m pytest
```

**Python/Server:**
- Paketverwaltung mit `uv` (ersetzt pip)
- Setup (einmalig): `uv venv venv` dann `uv pip install -e ".[dev]"`
- Neue Pakete: `uv pip install <paket>` (dann `pyproject.toml` manuell anpassen)

## 🔄 Git & Versioning

### Commit Messages
Conventional Commits Format ([docs/COMMIT_CONVENTION.md](docs/COMMIT_CONVENTION.md)):
```
feat: Neue Features
fix: Bugfixes
refactor: Code-Refactoring
docs: Dokumentation
chore: Build, Dependencies
```

Commits führt der User durch. Semantic Versioning ([docs/VERSIONING.md](docs/VERSIONING.md)): MAJOR = Breaking Changes, MINOR = neue Features, PATCH = Bugfixes.

## 📝 Dokumentation Updates

Nach Refactoring/Features: **ARCHITECTURE.md** (strukturelle Änderungen), **FEATURES.md** (neue Features), **COMPLEXITY.md** (Complexity-Reduktion), **README.md** (User-relevante Änderungen).

---

**Wichtig**: Diese Anweisungen haben **höchste Priorität** und überschreiben generische Best Practices.
