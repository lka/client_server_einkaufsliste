# Dokumentations-Index

Übersicht über alle verfügbaren Dokumentationen für die Client/Server Einkaufsliste.

## 📖 Hauptdokumentation

📄 **[README.md](../README.md)** - Hauptdokumentation im Repository-Root
- Projektübersicht und Zielsetzung
- Feature-Überblick
- Benutzungsanleitung (Einkaufsliste, Rezepte, Wochenplan, Verwaltung)
- Intelligentes Item-Matching
- Authentifizierung und Sicherheit
- Schnellverweise auf alle Dokumentationen

---

## 🚀 Erste Schritte

### [QUICKSTART.md](QUICKSTART.md)
**Schnellstartanleitung für neue Benutzer**

- Voraussetzungen (Python 3.13+, Node.js 16+)
- Installation Schritt für Schritt
- Server und Client starten
- Erste Schritte mit der Anwendung
- Troubleshooting bei Installationsproblemen

---

## ✨ Features & Funktionen

### [FEATURES.md](FEATURES.md)
**Vollständige Liste aller implementierten Features**

- JWT-Authentifizierung mit automatischem Token-Refresh
- Einkaufsliste mit Fuzzy-Matching und Department-Gruppierung
- Wochenplan-Verwaltung
- Rezept-Integration aus WebDAV (MyRecipeBox)
- Shopping-Templates
- Store & Product Management
- WebSocket-basierte Live-Synchronisation
- Datenbank-Backup/Restore
- Druckfunktionen für Wochenplan und Einkaufsliste
- Unit-System für Mengenangaben

---

## 📋 Releases

### [RELEASES.md](RELEASES.md)
**Chronologische Versionsgeschichte**

- Detaillierte Changelog für alle Releases
- Breaking Changes und Migrations-Hinweise
- Feature-Releases und Bug-Fixes
- Aktueller Stand: v6.0.8

---

## 👨‍💻 Für Entwickler

### Server-Dokumentation

#### [DEVELOPER.md](DEVELOPER.md)
**Technische Dokumentation für Entwickler**

- Projekt-Struktur (Server & Client)
- Installation der Entwicklungsumgebung
- API-Endpunkte Dokumentation
- Code-Qualität (Black, Flake8, ESLint)
- Testing (pytest, jest)
- Continuous Integration
- Architektur-Übersicht
- Troubleshooting

#### [server/DATABASE_SCHEMA.md](server/DATABASE_SCHEMA.md)
**Datenbank-Schema Dokumentation**

- Entity-Relationship-Diagramm
- Alle Datenbank-Tabellen (User, Store, Department, Product, Item, etc.)
- Beziehungen zwischen Entities
- Feld-Beschreibungen und Constraints
- SQLModel/SQLAlchemy Schema

### [COMPLEXITY.md](COMPLEXITY.md)
**Code-Komplexitätsanalyse und Qualitätssicherung**

- Zyklomatische Komplexität (McCabe-Metrik)
- Radon-Analysen für Python-Code
- Complexity-Report für TypeScript
- Refactoring-Historie
- Best Practices zur Komplexitätsreduzierung
- Beispiele: Extract Method, Eliminate Duplication
- Continuous Integration für Code-Qualität

### [VERSIONING.md](VERSIONING.md)
**Release-Workflow und Semantic Versioning**

- Semantic Versioning (MAJOR.MINOR.PATCH)
- Conventional Commits
- GitHub als Single Source of Truth
- Release-Prozess
- Automatische Versionierung
- Branch-Strategie

### [COMMIT_CONVENTION.md](COMMIT_CONVENTION.md)
**Conventional Commits Schnellreferenz**

- Commit-Message-Format
- Commit-Typen (feat, fix, docs, etc.)
- Scope und Subject Guidelines
- Breaking Changes
- Beispiele für gute Commit-Messages

---

## 🐳 Deployment & Debugging

### [DOCKER.md](DOCKER.md)
**Docker Deployment Anleitung**

- Docker & Docker Compose Setup
- Container-Konfiguration
- Environment Variables
- Volume-Management
- Production Deployment
- Troubleshooting

### [WEBSOCKET-DEBUG.md](WEBSOCKET-DEBUG.md)
**WebSocket Debugging Guide**

- Diagnose von WebSocket-Verbindungsproblemen
- iPad/Netzwerk-spezifische Issues
- Windows Firewall Konfiguration
- Logging und Debugging
- Häufige Probleme und Lösungen

---

## 💻 Client-Dokumentation (TypeScript)

### [client/README.md](client/README.md)
**Client-Anwendung Übersicht**

- TypeScript-Migration und Features
- Mengenangaben-Unterstützung
- Build & Development
- Testing mit Jest
- Client-spezifische Konfiguration

### [client/ARCHITECTURE.md](client/ARCHITECTURE.md)
**Client-Architektur: 4-Schichten-Modell (Modular aufgeteilt)**

- Hauptübersicht mit Quick Reference und Navigation
- **Detaillierte Module**:
  - [01-overview.md](client/architecture/01-overview.md) - Architektur-Diagramm und Layer-Details
  - [02-data-layer.md](client/architecture/02-data-layer.md) - API, Auth, WebSocket, Utilities
  - [03-state-layer.md](client/architecture/03-state-layer.md) - State Management & Observer Pattern
  - [04-ui-layer.md](client/architecture/04-ui-layer.md) - Components & Feature Modules
  - [05-pages.md](client/architecture/05-pages.md) - Pages & Entry Points
  - [06-modules.md](client/architecture/06-modules.md) - Weekplan Modules Deep-Dive
  - [07-refactoring.md](client/architecture/07-refactoring.md) - Refactoring Success Stories
  - [08-code-quality.md](client/architecture/08-code-quality.md) - Metrics, Testing, Performance

### [client/STATE_LAYER.md](client/STATE_LAYER.md)
**State Layer Detaildokumentation**

- Reactive State Management
- Observer Pattern Implementation
- State Classes und ihre Verantwortlichkeiten
- Event-driven Architecture
- State-Update-Flows

### [client/complexity-report.md](client/complexity-report.md)
**Client-Code Komplexitätsanalyse**

- Zyklomatische Komplexität der TypeScript-Module
- McCabe-Metriken pro Datei
- Complexity Report für alle UI-Komponenten
- Identifikation komplexer Module

### UI-Module Dokumentation

#### [client/ui/shopping-list.md](client/ui/shopping-list.md)
**Shopping List UI Module**

- Modular aufgebaute Shopping-List-Komponenten
- Print Preview Funktionalität
- Item Management
- Department Grouping
- Store Selection

#### [client/ui/weekplan.md](client/ui/weekplan.md)
**Weekplan Module**

- Wochenplan-System (13 fokussierte Module)
- Template und Recipe Integration
- Entry Management
- Person Count Handling
- Real-time Collaboration

---

## 📊 Dokumentations-Kategorien

### Benutzer-Dokumentation
1. [README.md](../README.md) - Allgemeine Übersicht und Benutzung
2. [QUICKSTART.md](QUICKSTART.md) - Schneller Einstieg
3. [FEATURES.md](FEATURES.md) - Feature-Übersicht

### Entwickler-Dokumentation (Server)
1. [DEVELOPER.md](DEVELOPER.md) - Technische Details
2. [server/DATABASE_SCHEMA.md](server/DATABASE_SCHEMA.md) - Datenbank-Schema
3. [COMPLEXITY.md](COMPLEXITY.md) - Code-Qualität (Python)
4. [VERSIONING.md](VERSIONING.md) - Release-Prozess
5. [COMMIT_CONVENTION.md](COMMIT_CONVENTION.md) - Commit-Konventionen

### Entwickler-Dokumentation (Client)
1. [client/README.md](client/README.md) - Client-Übersicht
2. [client/ARCHITECTURE.md](client/ARCHITECTURE.md) - 4-Schichten-Architektur
3. [client/STATE_LAYER.md](client/STATE_LAYER.md) - State Management
4. [client/complexity-report.md](client/complexity-report.md) - Code-Qualität (TypeScript)
5. [client/ui/shopping-list.md](client/ui/shopping-list.md) - Shopping List UI
6. [client/ui/weekplan.md](client/ui/weekplan.md) - Weekplan UI

### Deployment & Debugging
1. [DOCKER.md](DOCKER.md) - Docker Deployment
2. [WEBSOCKET-DEBUG.md](WEBSOCKET-DEBUG.md) - WebSocket Debugging

### Projekt-Historie
1. [RELEASES.md](RELEASES.md) - Versionsgeschichte

---

## 🔗 Externe Ressourcen

- [FastAPI Dokumentation](https://fastapi.tiangolo.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [SQLModel Dokumentation](https://sqlmodel.tiangolo.com/)
- [pytest Dokumentation](https://docs.pytest.org/)

---

## 📝 Dokumentations-Struktur

```
docs/
├── INDEX.md                  # Diese Datei - Übersicht aller Dokumentationen
│
├── QUICKSTART.md             # Schnellstartanleitung
├── FEATURES.md               # Vollständige Feature-Liste
├── RELEASES.md               # Versionsgeschichte
│
├── DEVELOPER.md              # Server: Technische Entwickler-Dokumentation
├── COMPLEXITY.md             # Server: Code-Komplexitätsanalyse (Python)
├── VERSIONING.md             # Release-Workflow
├── COMMIT_CONVENTION.md      # Conventional Commits Referenz
│
├── DOCKER.md                 # Docker Deployment
├── WEBSOCKET-DEBUG.md        # WebSocket Debugging Guide
│
├── server/                   # Server-spezifische Dokumentationen
│   └── DATABASE_SCHEMA.md    # Datenbank-Schema
│
└── client/                   # Client-Dokumentationen
    ├── README.md             # Client-Übersicht
    ├── ARCHITECTURE.md       # 4-Schichten-Architektur
    ├── STATE_LAYER.md        # State Management Details
    ├── complexity-report.md  # Code-Komplexität (TypeScript)
    └── ui/
        ├── shopping-list.md  # Shopping List UI Module
        └── weekplan.md       # Weekplan UI Module
```

---

**Zuletzt aktualisiert:** 2025-12-29
