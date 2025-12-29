# Versioning & Release Workflow

Dieses Projekt verwendet **Semantic Versioning** mit GitHub als Single Source of Truth und **Conventional Commits** für automatische Versionierung.

> **📚 Alle Dokumentationen:** Siehe [Dokumentations-Index](INDEX.md)

## Semantic Versioning Format

Versionen folgen dem Format `MAJOR.MINOR.PATCH`:

- **MAJOR**: Breaking Changes (inkompatible API-Änderungen)
- **MINOR**: Neue Features (rückwärtskompatibel)
- **PATCH**: Bug-Fixes (rückwärtskompatibel)

Beispiele: `1.0.0`, `1.2.3`, `2.0.0-beta.1`

## Conventional Commits

Commits sollten dem [Conventional Commits](https://www.conventionalcommits.org/) Format folgen:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Commit Types und Version Bumps

| Type | Beschreibung | Version Bump | Beispiel |
|------|-------------|--------------|----------|
| `feat:` | Neues Feature | **MINOR** (0.1.0 → 0.2.0) | `feat: add print function for shopping list` |
| `fix:` | Bug-Fix | **PATCH** (0.1.0 → 0.1.1) | `fix: resolve date picker timezone issue` |
| `perf:` | Performance-Verbesserung | **PATCH** | `perf: optimize database queries` |
| `BREAKING CHANGE:` | Breaking Change | **MAJOR** (0.1.0 → 1.0.0) | `feat!: redesign API structure` |
| `chore:` | Wartung/Dependencies | *kein Bump* | `chore: update dependencies` |
| `docs:` | Dokumentation | *kein Bump* | `docs: update README` |
| `style:` | Code-Formatierung | *kein Bump* | `style: format with black` |
| `refactor:` | Code-Refactoring | *kein Bump* | `refactor: simplify auth logic` |
| `test:` | Tests | *kein Bump* | `test: add unit tests for backup` |

### Commit-Beispiele

**Feature (Minor Bump):**
```bash
git commit -m "feat: add version display in user menu

Shows semantic version from git tags in dropdown menu.
Includes tooltip with API version."
```

**Bug-Fix (Patch Bump):**
```bash
git commit -m "fix: correct backup date string parsing

Converts ISO date strings to datetime objects before
database insert to prevent SQLite type errors."
```

**Breaking Change (Major Bump):**
```bash
git commit -m "feat!: redesign authentication system

BREAKING CHANGE: JWT tokens now require refresh endpoint.
Old tokens are no longer valid. Users must re-login."
```

**Maintenance (kein Bump):**
```bash
git commit -m "chore: update TypeScript to 5.0"
```

## Version Management

### Single Source of Truth: Git Tags

- Versionsnummern werden **ausschließlich** als Git Tags verwaltet
- Format: `v1.0.0`, `v1.2.3`, etc.
- Keine manuellen Version-Updates in Code-Dateien notwendig

### Automatische Version-Einbettung

Die Version wird automatisch aus Git Tags extrahiert und in die Anwendung eingebettet:

#### Server (Python)
- Datei: `server/src/version.py`
- Funktion: `get_version()` gibt aktuelle Version zurück
- Drei Methoden (in Prioritätsreihenfolge):
  1. **setuptools_scm** (bei `pip install`): Generiert `_version.py` aus Git Tags
  2. **Git direkt**: Führt `git describe --tags` aus
  3. **Fallback**: Default-Version `0.1.0`
- Konfiguriert in `pyproject.toml` unter `[tool.setuptools_scm]`

#### Client (TypeScript)
- Datei: `client/src/version.json`
- Enthält Version und Build-Datum
- Automatisch aus Git Tags generiert via Build-Skript

## Release-Workflow

### 1. Automatisches Release (Empfohlen)

**Dieser Workflow ist vollständig automatisiert!**

1. **Commits mit Conventional Commits schreiben**:
   ```bash
   git add .
   git commit -m "feat: add new shopping template feature"
   ```

2. **Zum main/master Branch pushen**:
   ```bash
   git push origin master
   ```

3. **GitHub Actions übernimmt automatisch**:
   - Analysiert Commits seit letztem Release
   - Berechnet neue Version basierend auf Commit-Types
   - Erstellt Git Tag (z.B. `v0.2.0`)
   - Führt Tests aus (Server + Client)
   - Baut Client
   - Generiert kategorisierten Changelog
   - Erstellt GitHub Release mit Release Notes

**Das war's! Kein manuelles Tagging mehr nötig.**

#### Changelog-Kategorien

Der automatische Changelog wird in Kategorien unterteilt:

- **⚠️ BREAKING CHANGES**: Commits mit `BREAKING CHANGE:` oder `!`
- **✨ Features**: Commits mit `feat:`
- **🐛 Bug Fixes**: Commits mit `fix:`
- **🔧 Other Changes**: Alle anderen Commits

### 2. Manuelles Release erstellen (Legacy)

#### Option A: Manuell mit PowerShell

```powershell
# 1. Version aus Git Tag extrahieren und in Dateien schreiben
.\scripts\update-version.ps1

# 2. Client bauen
cd client
npm run build
cd ..

# 3. Tests ausführen
cd server
python -m pytest tests/
cd ..

cd client
npm test
cd ..
```

#### Option B: Vollständig manuell

```bash
# 1. Neuen Tag erstellen
git tag v1.0.0

# 2. Version-Dateien aktualisieren
.\scripts\update-version.ps1

# 3. Änderungen committen (optional)
git add server/src/version.py client/src/version.json
git commit -m "chore: update version to 1.0.0"

# 4. Tag zu GitHub pushen
git push origin v1.0.0

# 5. (Optional) Commit pushen
git push
```

### 2. Automatisches Release via GitHub Actions

Wenn ein Version-Tag nach GitHub gepusht wird, startet automatisch der Release-Workflow:

1. **Tag pushen**: `git push origin v1.0.0`
2. **GitHub Actions wird ausgelöst** (`.github/workflows/release.yml`)
3. **Automatische Schritte**:
   - Version aus Tag extrahieren
   - Version-Dateien aktualisieren (`version.py`, `version.json`)
   - Python Dependencies installieren
   - Server-Tests ausführen
   - Node Dependencies installieren
   - Client bauen (`npm run build`)
   - Client-Tests ausführen
   - Changelog generieren (aus Git Commits seit letztem Tag)
   - GitHub Release erstellen mit:
     - Release Notes
     - Installation Instructions
     - Backup-Hinweis

### 3. GitHub Release erstellen (manuell)

Falls Sie die Automatisierung nicht nutzen möchten:

1. Gehen Sie zu GitHub → Releases → "Draft a new release"
2. Tag auswählen oder neu erstellen (z.B. `v1.0.0`)
3. Release Title: `Release 1.0.0`
4. Release Notes schreiben
5. "Publish release" klicken

## Version-API

### Server Endpoint

```bash
GET /api/version
```

Response:
```json
{
  "version": "1.0.0",
  "api": "v1"
}
```

### Verwendung in Backups

Backups enthalten automatisch die aktuelle App-Version:

```json
{
  "version": "1.0.0",
  "timestamp": "2025-11-13T15:00:00",
  "users": [...],
  ...
}
```

Beim Restore wird eine Warnung ausgegeben, wenn die Backup-Version von der aktuellen Version abweicht.

## Best Practices

### Wann neue Version erstellen?

- **PATCH** (1.0.X): Bug-Fixes, kleine Verbesserungen
  - Beispiel: Fehler in Backup-Funktion behoben
  - `git tag v1.0.1`

- **MINOR** (1.X.0): Neue Features (rückwärtskompatibel)
  - Beispiel: Neue Print-Funktion hinzugefügt
  - `git tag v1.1.0`

- **MAJOR** (X.0.0): Breaking Changes
  - Beispiel: Datenbank-Schema geändert, API-Änderungen
  - `git tag v2.0.0`

### Vor jedem Release

1. **Backup erstellen**: Empfehlung in Release Notes
2. **Tests ausführen**: Server + Client Tests müssen grün sein
3. **Changelog prüfen**: Was hat sich geändert?
4. **Breaking Changes dokumentieren**: Falls MAJOR Version

### Nach dem Release

1. Tag zu GitHub pushen: `git push origin v1.0.0`
2. GitHub Actions überprüfen: Release wurde erfolgreich erstellt?
3. Release Notes vervollständigen falls nötig

## Python Package Installation

Wenn Sie das Projekt als Python-Package installieren möchten:

```bash
# Development Installation (mit setuptools_scm)
pip install -e .

# Dies generiert automatisch server/src/_version.py aus Git Tags
```

Die `pyproject.toml` ist so konfiguriert, dass:
- Die Version dynamisch aus Git Tags gelesen wird (`dynamic = ["version"]`)
- `setuptools_scm` die Version automatisch extrahiert
- Die Version in `server/src/_version.py` geschrieben wird

## Troubleshooting

### "No git tags found"

Erster Release? Erstellen Sie den ersten Tag:

```bash
git tag v0.1.0
git push origin v0.1.0
```

### Version wird nicht aktualisiert

Führen Sie das Update-Skript aus:

```powershell
.\scripts\update-version.ps1
```

Oder installieren Sie das Package neu (generiert `_version.py`):

```bash
pip install -e .
```

### GitHub Actions schlägt fehl

Prüfen Sie:
- Tests sind grün lokal?
- `pyproject.toml` Dependencies sind aktuell?
- GitHub Actions Permissions sind korrekt gesetzt?

## Zusammenfassung

**Workflow in Kürze:**

1. Feature entwickeln + committen
2. Neue Version taggen: `git tag v1.0.0`
3. Tag pushen: `git push origin v1.0.0`
4. GitHub Actions erstellt automatisch Release
5. Fertig! 🎉

**GitHub ist die Single Source of Truth - alle Versionsinformationen kommen von Git Tags.**
