# Conventional Commits - Quick Reference

Dieses Projekt verwendet [Conventional Commits](https://www.conventionalcommits.org/) für automatische Versionierung.

## Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

## Types und Version Bumps

| Type | Version | Beispiel |
|------|---------|----------|
| `feat:` | **MINOR** ↗ | `feat: add backup restore functionality` |
| `fix:` | **PATCH** ↗ | `fix: resolve timezone bug in date picker` |
| `perf:` | **PATCH** ↗ | `perf: optimize database queries` |
| `feat!:` oder `BREAKING CHANGE:` | **MAJOR** ↗ | `feat!: redesign API authentication` |
| `chore:` | *keine* | `chore: update dependencies` |
| `docs:` | *keine* | `docs: update README` |
| `style:` | *keine* | `style: format code with black` |
| `refactor:` | *keine* | `refactor: simplify auth logic` |
| `test:` | *keine* | `test: add backup unit tests` |
| `ci:` | *keine* | `ci: update GitHub Actions workflow` |

## Beispiele

### Feature (Minor Bump)
```bash
git commit -m "feat: add version display in user menu"
```

### Bug-Fix (Patch Bump)
```bash
git commit -m "fix: correct date string parsing in backup restore"
```

### Breaking Change (Major Bump)
```bash
git commit -m "feat!: redesign authentication system

BREAKING CHANGE: JWT tokens now require refresh endpoint.
Old tokens are no longer valid."
```

### Mit Scope
```bash
git commit -m "feat(backup): add automatic version tagging"
git commit -m "fix(ui): resolve menu dropdown positioning"
git commit -m "docs(readme): update installation instructions"
```

### Maintenance (kein Bump)
```bash
git commit -m "chore: update TypeScript to 5.0"
git commit -m "docs: fix typo in VERSIONING.md"
git commit -m "style: format with prettier"
```

## Automatischer Release-Prozess

1. **Commit** mit Conventional Commits Format
2. **Push** zu `master` oder `main` Branch
3. **GitHub Actions** erledigt automatisch:
   - Analysiert alle Commits seit letztem Release
   - Berechnet neue Version (basierend auf Types)
   - Erstellt Git Tag (z.B. `v0.2.0`)
   - Führt Tests aus
   - Erstellt GitHub Release mit kategorisiertem Changelog

## Changelog-Kategorien

- **⚠️ BREAKING CHANGES**: `feat!:` oder `BREAKING CHANGE:`
- **✨ Features**: `feat:`
- **🐛 Bug Fixes**: `fix:`
- **🔧 Other Changes**: Alle anderen

## Tipps

✅ **DO:**
- Verwende Präsens: "add feature" nicht "added feature"
- Beginne mit Kleinbuchstaben: "add" nicht "Add"
- Keine Punkt am Ende der Subject-Zeile
- Halte Subject unter 72 Zeichen
- Verwende Body für Details (optional)

❌ **DON'T:**
- Keine generischen Messages: "update", "fix stuff"
- Keine Caps: "ADD FEATURE" oder "Fix Bug"
- Keine falschen Types: `feat:` für Bug-Fixes verwenden

## Weitere Informationen

Siehe [VERSIONING.md](../VERSIONING.md) für den vollständigen Release-Workflow.
