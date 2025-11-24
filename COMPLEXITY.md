# Code-Komplexitätsanalyse

Dieses Dokument beschreibt, wie Sie die Zyklomatische Komplexität (McCabe-Zahl) und andere Code-Metriken für dieses Projekt berechnen können.

## Was ist Zyklomatische Komplexität?

Die **Zyklomatische Komplexität** (auch McCabe-Metrik genannt) ist ein Software-Maß, das die Komplexität eines Programms misst. Sie gibt die Anzahl der linear unabhängigen Pfade durch den Quellcode an.

### Bewertung:

- **A (1-5)**: Einfacher Code, leicht wartbar
- **B (6-10)**: Moderate Komplexität, akzeptabel
- **C (11-20)**: Hohe Komplexität, sollte überprüft werden
- **D (21-30)**: Sehr hohe Komplexität, Refactoring empfohlen
- **F (>30)**: Extreme Komplexität, dringend Refactoring nötig

## Python (Server)

### Tool: Radon

Radon ist das Standard-Tool für Python-Komplexitätsanalyse.

#### Installation:

```bash
cd server
pip install radon
```

#### Befehle:

**Zyklomatische Komplexität:**
```bash
# Kurze Übersicht
radon cc src -a

# Mit Durchschnitt und sortiert
radon cc src -a -s

# Detailliert mit allen Funktionen
radon cc src -a -s --show-closures

# Nur Funktionen mit hoher Komplexität (C und höher)
radon cc src -nc
```

**Maintainability Index:**
```bash
# Wartbarkeitsindex für alle Dateien
radon mi src -s

# Nur Dateien mit niedrigem Index (<= 20)
radon mi src -n C
```

**Halstead-Metriken:**
```bash
# Halstead-Komplexitätsmetriken
radon hal src
```

**Alle Metriken kombiniert:**
```bash
# Umfassender Bericht
radon cc src -a -s > complexity-python.txt
radon mi src -s >> complexity-python.txt
```

### Aktuelle Ergebnisse (Server):

**Durchschnittliche Komplexität:** A (3.21) ✅ Verbessert von 3.49

**Kritische Funktionen (D-Rating):** ✅ Alle eliminiert!
- ~~`merge_quantities()` in `utils.py` - D (21)~~ → **B (10)** - 52% Reduzierung
- ~~`create_item()` in `routers/items.py` - D (21)~~ → **B (8)** - 62% Reduzierung

**Hohe Komplexität (C-Rating):** ✅ Alle refactored!
- ~~`restore_backup()` in `routers/backup.py` - C (18)~~ → **A (4)** - 78% Reduzierung
- ~~`get_product_suggestions()` in `routers/products.py` - C (18)~~ → **B (9)** - 50% Reduzierung
- ~~`convert_date_strings()` in `routers/backup.py` - C (11)~~ → **B (9)** - 18% Reduzierung

**Moderate Komplexität (B-Rating):**
- `convert_item_to_product()` in `routers/items.py` - B (10)
- `websocket_endpoint()` in `main.py` - B (10)
- `seed_stores_and_departments()` in `seed_data.py` - B (10)
- `update_template()` in `routers/templates.py` - B (10)
- `merge_quantities()` in `utils.py` - B (10) ✅
- `update_product()` in `routers/products.py` - B (9)
- `get_product_suggestions()` in `routers/products.py` - B (9) ✅
- `convert_date_strings()` in `routers/backup.py` - B (9) ✅
- Weitere siehe `radon cc src -a -s`

**Extrahierte Helper-Funktionen:**

**utils.py:**
- `_validate_quantities()` - B (6) - Validierung von Randfällen
- `_format_quantity_value()` - A (3) - Formatierung
- `_merge_single_part()` - B (7) - Einzelmengen-Merging

**routers/items.py:**
- `_find_existing_item()` - A (3) - Exakte und Fuzzy-Suche
- `_handle_item_merge()` - A (3) - Mengen-Merging und Broadcasting
- `_create_negative_quantity_dummy()` - A (1) - Dummy-Item für negative Mengen
- `_find_matching_product()` - B (8) - Fuzzy-Matching zu Produkten
- `_enrich_with_department()` - A (4) - Anreicherung mit Department-Info

**routers/backup.py:**
- `_try_parse_iso_date()` - A (3) - Datum-Parsing
- `_clear_existing_data()` - B (8) - Löschen aller Daten
- `_restore_entity_list()` - A (2) - Wiederherstellen einer Entity-Liste

**routers/products.py:**
- `_add_products_to_matches()` - A (4) - Produkte zu Matches hinzufügen
- `_add_template_items_to_matches()` - B (7) - Template-Items zu Matches hinzufügen

**Maintainability Index:**
- Alle Module haben Rating A (>50)
- Durchschnitt verbessert durch Refaktorierung

**Refactoring-Historie:**
- **2025-01-24**: Erfolgreiche Refaktorierung aller kritischen Funktionen mit Extract Method Pattern
- Alle 72 Tests bestehen nach Refaktorierung
- Durchschnittliche Komplexität von A (3.49) auf A (3.21) verbessert

## TypeScript/JavaScript (Client)

### Tool: complexity-report

#### Installation:

```bash
cd client
npm install --save-dev complexity-report
```

#### Befehle:

**Komplexitätsbericht für einzelne Datei:**
```bash
npx cr src/ui/shopping-list-ui.ts
```

**Komplexitätsbericht für alle Dateien:**
```bash
npx cr src/**/*.ts --format markdown > complexity-report.md
```

**JSON-Format für weitere Verarbeitung:**
```bash
npx cr src/**/*.ts --format json > complexity-report.json
```

**NPM-Skript (bereits konfiguriert):**
```bash
npm run complexity
```

### Alternative: ESLint Complexity Rule

ESLint kann auch Komplexitätswarnungen während der Entwicklung anzeigen.

#### .eslintrc.json Beispiel:

```json
{
  "rules": {
    "complexity": ["warn", 10],
    "max-depth": ["warn", 4],
    "max-lines-per-function": ["warn", { "max": 50 }],
    "max-nested-callbacks": ["warn", 3]
  }
}
```

## Continuous Integration

### Automatische Komplexitätsprüfung

Sie können die Komplexitätsanalyse in Ihre CI/CD-Pipeline integrieren:

**Für Python (GitHub Actions Beispiel):**
```yaml
- name: Check Code Complexity
  run: |
    pip install radon
    radon cc server/src -a -s
    radon cc server/src -nc  # Fail if complexity > C
```

**Für TypeScript:**
```yaml
- name: Check Code Complexity
  run: |
    cd client
    npm run complexity
```

## Empfehlungen zur Komplexitätsreduzierung

### Allgemeine Strategien:

1. **Extract Method**: Teilen Sie große Funktionen in kleinere auf
2. **Guard Clauses**: Verwenden Sie frühe Returns statt tiefer Verschachtelung
3. **Strategy Pattern**: Ersetzen Sie komplexe if/else-Ketten durch Strategie-Objekte
4. **State Pattern**: Vereinfachen Sie komplexe Zustandslogik
5. **Table-Driven Methods**: Verwenden Sie Lookup-Tabellen statt if/else

### Beispiel - Vorher (Komplexität: 21):

```python
def merge_quantities(existing, new):
    if not existing:
        if not new:
            return None
        return new
    if not new:
        return existing
    # ... viele weitere if/else ...
```

### Beispiel - Nachher (Komplexität: ~8):

```python
def merge_quantities(existing, new):
    # Extract sub-functions
    if not existing and not new:
        return None
    if not existing:
        return handle_new_only(new)
    if not new:
        return existing
    return merge_with_existing(existing, new)
```

## Weitere Tools

### Python:
- **Pylint**: `pip install pylint` - Umfassende Code-Analyse
- **McCabe**: `pip install mccabe` - Reine Komplexitätsanalyse
- **Prospector**: `pip install prospector` - Kombiniert mehrere Tools

### TypeScript/JavaScript:
- **ESLint**: Integrierte Komplexitätsregeln
- **SonarQube**: Enterprise-Lösung mit detaillierten Metriken
- **Code Climate**: Cloud-basierte Code-Qualitätsanalyse

## Interpretation der Ergebnisse

### Wann sollte refactored werden?

- **Sofort**: Funktionen mit Rating D oder F
- **Bald**: Funktionen mit Rating C und häufigen Änderungen
- **Optional**: Funktionen mit Rating C, die stabil sind
- **OK**: Funktionen mit Rating A oder B

### Prioritäten:

1. Funktionen mit hoher Komplexität UND häufigen Bugs
2. Funktionen mit hoher Komplexität UND häufigen Änderungen
3. Kernfunktionen mit mittlerer Komplexität
4. Selten geänderte Funktionen mit hoher Komplexität

## Regelmäßige Überprüfung

Empfohlen wird eine monatliche Überprüfung der Komplexitätsmetriken:

```bash
# Erstellen Sie einen Snapshot
date=$(date +%Y-%m-%d)
cd server && radon cc src -a -s > "../complexity-reports/python-$date.txt"
cd ../client && npm run complexity
mv complexity-report.md "../complexity-reports/typescript-$date.md"
```

Vergleichen Sie die Trends über die Zeit, um sicherzustellen, dass die Code-Qualität stabil bleibt oder sich verbessert.
