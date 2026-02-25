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
- ✅ **Verwende bestehende Komponenten**: `client/src/ui/components/` (buttons, inputs, modals)
- ✅ **State Management**: Immer über State Layer, nie direkter DOM-State
- ✅ **API-Aufrufe**: Nur über Data Layer (`src/data/api.ts`)
- ✅ **WebSocket**: Nur über `src/data/websocket.ts`
- ❌ **Keine UI-Frameworks**: Vanilla JS/TypeScript, kein React/Vue/Angular
- ❌ **Keine direkten API-Aufrufe aus UI**: Immer über Data Layer

**Modularisierung:**
- Dateien über 200 Zeilen oder McCabe > 50 in Unterverzeichnis aufteilen
- Pattern: `module-name/` mit `index.ts` als Public API
- Backward Compatibility durch Re-Exports im alten Pfad

### Server (Python)

**Struktur:**
- `server/src/routers/`: API-Endpunkte nach Ressourcen gruppiert
- `server/src/models.py`: SQLModel Datenbank-Modelle
- `server/src/dependencies.py`: Dependency Injection (DB-Sessions, Auth)

**Wichtige Regeln:**
- ✅ **DRY**: Wiederverwendung von Helper-Funktionen
- ✅ **Fuzzy Matching**: Verwende `_find_item_by_match_strategy()` aus `items.py`
- ✅ **Type Safety**: Pydantic/SQLModel für Validierung
- ❌ **Keine zirkulären Imports**: Helper-Funktionen in separate Module

## 🎨 UI/UX Richtlinien

### Komponenten-Nutzung
```typescript
// ✅ RICHTIG: Verwende bestehende Komponenten
import { createButton } from '../components/button.js';
import { createInput } from '../components/input.js';
import { showModal } from '../components/modal.js';

// ❌ FALSCH: Eigene Button-Implementierung
const button = document.createElement('button');
```

### Print-Layout (Einkaufsliste)
- Format: DIN A4 quer
- Layout: 4 Spalten
- Rand: 1 cm außen
- Spalten-Abstand: 1 cm
- Duplex: Wenden über kurze Seite

### Standard-Patterns
- **Datum**: ISO 8601 (YYYY-MM-DD) im Backend, DE-Format (DD.MM.YYYY) im UI
- **Fehlerbehandlung**: Modals für User-Feedback, Console für Debug
- **Loading States**: Während API-Aufrufen anzeigen

## 📊 Code-Qualität

### Komplexitätsziele
- **McCabe-Komplexität**: Ziel ≤ 50 pro Datei, ideal < 30
- **Zyklomatische Komplexität**: Ziel < 40
- **Dateigröße**: ≤ 200 Zeilen (bei mehr: modularisieren)

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

**Wichtig für Python/Server:**
- Paketverwaltung mit `uv` (ersetzt pip)
- Setup (einmalig): `uv venv venv` dann `uv pip install -e ".[dev]"`
- Aktivierung optional: `.\venv\Scripts\Activate.ps1`
- Neue Pakete hinzufügen: `uv pip install <paket>` (dann `pyproject.toml` manuell anpassen)

### Refactoring-Pattern
1. **Extract Method**: Lange Funktionen in Helper aufteilen
2. **Extract Module**: Ähnliche Funktionen in eigenes Modul
3. **DRY**: Code-Duplikation eliminieren
4. **Single Responsibility**: Eine Aufgabe pro Funktion

## 🔄 Git & Versioning

### Commit Messages
Conventional Commits Format ([docs/COMMIT_CONVENTION.md](docs/COMMIT_CONVENTION.md)):
```
<type>(<scope>): <description>

feat: Neue Features
fix: Bugfixes
refactor: Code-Refactoring
docs: Dokumentation
chore: Build, Dependencies
```

**Commit-Footer immer anhängen:**
```
🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### Versioning
Semantic Versioning ([docs/VERSIONING.md](docs/VERSIONING.md)):
- **MAJOR**: Breaking Changes
- **MINOR**: Neue Features (backward compatible)
- **PATCH**: Bugfixes

## 🔍 Bevor du Code schreibst

**Checklist:**
1. ✅ Relevante Dokumentation gelesen?
2. ✅ Bestehende ähnliche Implementierungen gesucht?
3. ✅ Architektur-Layer korrekt?
4. ✅ Bestehende Komponenten/Helper-Funktionen genutzt?
5. ✅ Tests nach Änderungen ausgeführt?

## 🚫 Häufige Fehler vermeiden

### Client
- ❌ Neue UI-Komponenten erstellen statt bestehende zu nutzen
- ❌ Direkter API-Aufruf aus UI-Komponenten
- ❌ State in DOM statt State Layer
- ❌ Frameworks oder Libraries hinzufügen

### Server
- ❌ Duplikate von Matching-Logik (nutze `_find_item_by_match_strategy()`)
- ❌ SQL-Queries direkt statt SQLModel
- ❌ Fehlende Type Hints
- ❌ Keine Fehlerbehandlung bei API-Endpunkten

### Allgemein
- ❌ Über-Engineering (YAGNI - You Aren't Gonna Need It)
- ❌ Code-Duplikation statt Wiederverwendung
- ❌ Fehlende Dokumentation bei komplexen Änderungen
- ❌ Breaking Changes ohne Major Version Bump

## 💡 Best Practices

### Refactoring
- **Modularisierung**: Wenn Datei > 200 Zeilen → Unterverzeichnis
- **Helper-Funktionen**: Wiederkehrende Logik auslagern
- **Backward Compatibility**: Bei Refactoring alte Exporte beibehalten

### Features
- **Intelligent Item Matching**: Exact Match bei Produktliste, Fuzzy sonst (80%)
- **WebSocket**: Echtzeit-Updates für kollaborative Features
- **State Management**: Observer Pattern für reaktive UI-Updates

### Testing
- **Server**: pytest mit 100+ Tests, Coverage-Ziel > 80%
- **Client**: Manuelle Tests nach UI-Änderungen
- **Integration**: Beide Seiten nach API-Änderungen testen

## 📝 Dokumentation Updates

**Nach Refactoring/Features:**
1. **ARCHITECTURE.md**: Bei strukturellen Änderungen
2. **FEATURES.md**: Bei neuen Features
3. **COMPLEXITY.md**: Nach Complexity-Reduktion
4. **README.md**: Bei User-relevanten Änderungen

## 🎓 Projekt-spezifisches Wissen

### Intelligentes Item-Matching
```python
# In items.py: _find_item_by_match_strategy()
# Exact Match wenn in Produktliste, sonst Fuzzy (80%)
# Verhindert: "Kürbiskerne" + "Kürbiskernöl" Vermischung
# Erlaubt: "Möhre" + "Möhren" Zusammenführung
```

### Client State Management
```typescript
// Zentral in src/state/*.ts
// Observer Pattern für reaktive Updates
// Nie direkter DOM-State
```

### WebSocket Integration
```typescript
// src/data/websocket.ts
// Event-basiert: onItemAdded, onWeekplanChanged, etc.
// Automatische UI-Updates via State Layer
```

## 🤝 Workflow

1. **Verstehen**: Dokumentation lesen, bestehenden Code analysieren
2. **Planen**: Architektur-konform, bestehende Patterns nutzen
3. **Implementieren**: Klein, fokussiert, testbar
4. **Testen**: TypeScript kompilieren, Tests laufen lassen
5. **Dokumentieren**: Relevante Docs aktualisieren
6. **Committen**: Commits führt der User durch, ansonsten Conventional Commits mit Footer

---

**Wichtig**: Diese Anweisungen haben **höchste Priorität** und überschreiben generische Best Practices wenn sie im Konflikt stehen.
