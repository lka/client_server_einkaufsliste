# Code-Komplexitätsanalyse

Dieses Dokument beschreibt, wie Sie die Zyklomatische Komplexität (McCabe-Zahl) und andere Code-Metriken für dieses Projekt berechnen können.

> **📚 Alle Dokumentationen:** Siehe [Dokumentations-Index](INDEX.md)

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

**Durchschnittliche Komplexität (gesamt):** A (3.78)

**Modul-spezifische Komplexität:**
- `routers/weekplan.py`: B (5.96) - Verbessert von 7.0 (enthält komplexe Business-Logik)

**Kritische Funktionen (D-Rating):** ✅ Alle eliminiert!
- ~~`merge_quantities()` in `utils.py` - D (21)~~ → **B (10)** - 52% Reduzierung
- ~~`create_item()` in `routers/items.py` - D (21)~~ → **B (8)** - 62% Reduzierung
- ~~`update_weekplan_entry_deltas()` in `routers/weekplan.py` - D (24)~~ → **B (6)** - 75% Reduzierung
- ~~`_add_recipe_items_to_shopping_list()` in `routers/weekplan.py` - D (21)~~ → **B (9)** - 57% Reduzierung
- ~~`_remove_recipe_items_from_shopping_list()` in `routers/weekplan.py` - D (21)~~ → **B (9)** - 57% Reduzierung

**Hohe Komplexität (C-Rating):** ✅ Hauptfunktionen refactored!
- ~~`restore_backup()` in `routers/backup.py` - C (18)~~ → **A (4)** - 78% Reduzierung
- ~~`get_product_suggestions()` in `routers/products.py` - C (18)~~ → **B (9)** - 50% Reduzierung
- ~~`convert_date_strings()` in `routers/backup.py` - C (11)~~ → **B (9)** - 18% Reduzierung
- `_add_template_items_to_shopping_list()` in `routers/weekplan.py` - C (20)
- `_calculate_shopping_date()` in `routers/weekplan.py` - C (18)
- `_handle_recipe_person_count_change()` in `routers/weekplan.py` - C (17)
- `_remove_template_items_from_shopping_list()` in `routers/weekplan.py` - C (16)
- `_handle_person_count_change()` in `routers/weekplan.py` - C (13)

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
- `_find_item_by_match_strategy()` - A (2) - Intelligente Fuzzy/Exact Strategie
- `_find_existing_item()` - A (3) - Exakte und Fuzzy-Suche
- `_find_existing_item_exact()` - A (2) - Nur exakte Suche
- `_find_exact_product_match()` - A (2) - Prüft exakte Produktübereinstimmung
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

**routers/weekplan.py:**
- `_add_or_merge_ingredient_item()` - A (5) - Item hinzufügen oder mergen
- `_process_recipe_ingredients()` - B (6) - Rezeptzutaten verarbeiten (hinzufügen)
- `_process_delta_items()` - A (2) - Delta-Items verarbeiten (hinzufügen)
- `_subtract_ingredient_item()` - A (3) - Menge von Item subtrahieren
- `_process_recipe_ingredients_removal()` - B (6) - Rezeptzutaten verarbeiten (entfernen)
- `_process_delta_items_removal()` - A (2) - Delta-Items verarbeiten (entfernen)
- `_calculate_delta_changes()` - A (3) - Delta-Änderungen berechnen
- `_handle_added_items_changes()` - A (4) - Added_items Änderungen behandeln
- `_update_recipe_deltas()` - B (8) - Rezept-Deltas aktualisieren
- `_update_template_deltas()` - B (6) - Template-Deltas aktualisieren

**Maintainability Index:**
- Alle Module haben Rating A (>50)
- Durchschnitt verbessert durch Refaktorierung

**Refactoring-Historie:**
- **2025-01-24**: Erfolgreiche Refaktorierung aller kritischen Funktionen mit Extract Method Pattern
  - Alle 72 Tests bestehen nach Refaktorierung
  - Durchschnittliche Komplexität von A (3.49) auf A (3.21) verbessert

- **2025-12-29**: Umfangreiches Refactoring von `routers/weekplan.py` und `routers/items.py`
  - **Intelligente Item-Suche**: Neue Funktion `_find_item_by_match_strategy()` in `routers/items.py` nutzt Fuzzy-Matching nur wenn Item nicht in Produktliste
  - **Konsistente Matching-Strategie**: Alle Wege Items zur Einkaufsliste hinzuzufügen (manuell, Rezepte, Templates) nutzen nun die gleiche intelligente Matching-Strategie
  - **3 kritische D-Funktionen eliminiert**:
    - `update_weekplan_entry_deltas()`: D (24) → B (6) - **75% Reduktion**
    - `_add_recipe_items_to_shopping_list()`: D (21) → B (9) - **57% Reduktion**
    - `_remove_recipe_items_from_shopping_list()`: D (21) → B (9) - **57% Reduktion**
  - **11 neue Helper-Funktionen** extrahiert mit klaren Verantwortlichkeiten
  - **Code-Duplikation** an ~20 Stellen eliminiert durch Wiederverwendung
  - **Modul-Komplexität** `routers/weekplan.py` von B (7.0) auf B (5.96) verbessert - **15% Reduktion**
  - **Gesamt-Komplexität** von A (3.21) auf A (3.78) (45 Funktionen hinzugefügt, Durchschnitt leicht gestiegen)
  - Alle 117 Tests bestehen nach Refaktorierung
  - Architektur-Verbesserungen:
    - DRY-Prinzip: Zentrale Matching-Strategie wiederverwendbar
    - Single Responsibility: Jede Funktion hat eine klare Aufgabe
    - Bessere Wartbarkeit: Änderungen nur an einer Stelle nötig
    - Erhöhte Testbarkeit: Kleine Funktionen einfacher zu testen

- **2025-12-30**: Client-Refactoring `stores-api.ts` - Modularisierung Store/Department Operations
  - **Trennung**: Store- und Department-Operationen in separate Module aufgeteilt
  - **Komplexität reduziert**: McCabe 50 → 21 (58% Reduktion)
  - **Neue Struktur**:
    - `stores-api/stores.ts`: Store CRUD-Operationen (119 Zeilen, McCabe 21)
    - `stores-api/departments.ts`: Department CRUD-Operationen (126 Zeilen, McCabe 21)
    - `stores-api/index.ts`: Public API mit Re-Exports (20 Zeilen, McCabe 0)
    - `stores-api.ts`: Backward Compatibility Re-Export (20 Zeilen, McCabe 0)
  - **Vorteile**:
    - Klare Trennung der Verantwortlichkeiten
    - Jedes Modul < 130 Zeilen, Single Responsibility
    - Volle Backward Compatibility über Re-Exports
    - Alle bestehenden Imports funktionieren weiterhin
  - **Status**: ✅ Alle Dateien nun McCabe ≤49

- **2025-12-30**: Client-Refactoring `shopping-list-ui.ts` - Modularisierung UI-Komponenten
  - **Trennung**: Initialization, DatePicker-Management und Event-Handler in separate Module aufgeteilt
  - **Komplexität reduziert**: McCabe 49 → 22 (55% Reduktion)
  - **Neue Struktur**:
    - `shopping-list-ui/initialization.ts`: Main UI Setup (82 Zeilen, McCabe 14)
    - `shopping-list-ui/date-picker-manager.ts`: DatePicker Operations (93 Zeilen, McCabe 14)
    - `shopping-list-ui/event-handlers.ts`: Event Handling (98 Zeilen, McCabe 22)
    - `shopping-list-ui/index.ts`: Public API (18 Zeilen, McCabe 0)
    - `shopping-list-ui.ts`: Backward Compatibility Re-Export (50 Zeilen, McCabe 3)
  - **Vorteile**:
    - Klare Trennung: Initialisierung, DatePicker, Events
    - Jedes Modul < 100 Zeilen, Single Responsibility
    - Volle Backward Compatibility über Re-Exports
    - Alle bestehenden Imports funktionieren weiterhin
  - **Status**: ✅ Alle Dateien nun McCabe ≤48

- **2025-12-30**: Client-Refactoring `webdav-api.ts` - Modularisierung CRUD/Import
  - **Trennung**: CRUD-Operationen und Recipe-Import mit SSE in separate Module aufgeteilt
  - **Komplexität reduziert**: McCabe 50 → 30 (40% Reduktion)
  - **Neue Struktur**:
    - `webdav-api/crud.ts`: WebDAV Settings CRUD (121 Zeilen, McCabe 20)
    - `webdav-api/import.ts`: Recipe Import mit SSE-Support (116 Zeilen, McCabe 30)
    - `webdav-api/index.ts`: Public API (19 Zeilen, McCabe 0)
    - `webdav-api.ts`: Backward Compatibility Re-Export (19 Zeilen, McCabe 0)
  - **Vorteile**:
    - Klare Trennung: CRUD vs. Import mit Server-Sent Events
    - Jedes Modul < 125 Zeilen, Single Responsibility
    - Volle Backward Compatibility über Re-Exports
    - Alle bestehenden Imports funktionieren weiterhin
  - **Status**: ✅ Alle Dateien nun McCabe ≤48

- **2025-12-30**: Client-Refactoring `autocomplete.ts` - Modularisierung Component
  - **Trennung**: Types, Styles, Rendering, Main Class Logic in separate Module aufgeteilt
  - **Komplexität reduziert**: McCabe 49 → 20 (59% Reduktion)
  - **Neue Struktur**:
    - `autocomplete/types.ts`: TypeScript Interfaces (17 Zeilen, McCabe 0)
    - `autocomplete/styles.ts`: CSS Injection (64 Zeilen, McCabe 3)
    - `autocomplete/rendering.ts`: Pure DOM Rendering Functions (74 Zeilen, McCabe 10)
    - `autocomplete/autocomplete.ts`: Main Autocomplete Class (196 Zeilen, McCabe 20)
    - `autocomplete/index.ts`: Public API (19 Zeilen, McCabe 1)
    - `autocomplete.ts`: Backward Compatibility Re-Export (20 Zeilen, McCabe 0)
  - **Vorteile**:
    - Klare Trennung: Types, Styles, Rendering, Class Logic
    - Jedes Modul < 200 Zeilen, Single Responsibility
    - Pure Functions im rendering.ts (leicht testbar)
    - Volle Backward Compatibility über Re-Exports
    - Alle bestehenden Imports funktionieren weiterhin
  - **Status**: ✅ Alle Dateien nun McCabe ≤48

- **2025-12-30**: Client-Refactoring `user-admin.ts` - Modularisierung User Management
  - **Trennung**: Initialization, Rendering, Event Handlers, Utilities in separate Module aufgeteilt
  - **Komplexität reduziert**: McCabe 48 → 27 (44% Reduktion)
  - **Neue Struktur**:
    - `user-admin/initialization.ts`: Main UI init and user loading (31 Zeilen, McCabe 4)
    - `user-admin/rendering.ts`: User list rendering (110 Zeilen, McCabe 27)
    - `user-admin/event-handlers.ts`: Approve/delete handlers (74 Zeilen, McCabe 17)
    - `user-admin/utils.ts`: Utility functions (28 Zeilen, McCabe 2)
    - `user-admin/index.ts`: Public API (9 Zeilen, McCabe 0)
    - `user-admin.ts`: Backward Compatibility Re-Export (13 Zeilen, McCabe 0)
  - **Vorteile**:
    - Klare Trennung: Initialization, Rendering, Event Handlers, Utilities
    - Jedes Modul < 120 Zeilen, Single Responsibility
    - Volle Backward Compatibility über Re-Exports
    - Alle bestehenden Imports funktionieren weiterhin
  - **Status**: ✅ **Alle Dateien nun McCabe ≤43!** Neuer Meilenstein erreicht

- **2025-12-30**: Client-Refactoring `entry-input.ts` - Modularisierung Weekplan Entry Input
  - **Trennung**: Entry Handler, Input Creation, Entry Saving, Autocomplete, Date Utils in separate Module aufgeteilt
  - **Komplexität reduziert**: McCabe 46 → 21 (54% Reduktion)
  - **Neue Struktur**:
    - `entry-input/entry-handler.ts`: Main add meal handler (44 Zeilen, McCabe 13)
    - `entry-input/input-creation.ts`: Input & autocomplete setup (81 Zeilen, McCabe 16)
    - `entry-input/entry-save.ts`: Entry saving logic (48 Zeilen, McCabe 17)
    - `entry-input/autocomplete-helpers.ts`: Suggestion search & parsing (89 Zeilen, McCabe 21)
    - `entry-input/date-utils.ts`: Date calculation (20 Zeilen, McCabe 1)
    - `entry-input/index.ts`: Public API (10 Zeilen, McCabe 0)
    - `entry-input.ts`: Backward Compatibility Re-Export (14 Zeilen, McCabe 0)
  - **Vorteile**:
    - Klare Trennung: Handler, Input, Saving, Autocomplete, Utils
    - Jedes Modul < 90 Zeilen, Single Responsibility
    - Autocomplete-Logik isoliert und wiederverwendbar
    - Volle Backward Compatibility über Re-Exports
    - Alle bestehenden Imports funktionieren weiterhin
  - **Status**: ✅ Alle Dateien weiterhin McCabe ≤43

- **2025-12-30**: Client-Refactoring `items-api.ts` - Modularisierung Items API
  - **Trennung**: Fetch, Create/Delete, Convert Operations in separate Module aufgeteilt
  - **Komplexität reduziert**: McCabe 43 → 27 (37% Reduktion)
  - **Neue Struktur**:
    - `items-api/create-delete-operations.ts`: Add/Delete items (104 Zeilen, McCabe 27)
    - `items-api/fetch-operations.ts`: Fetch items (63 Zeilen, McCabe 11)
    - `items-api/convert-operations.ts`: Convert to product (42 Zeilen, McCabe 5)
    - `items-api/index.ts`: Public API (6 Zeilen, McCabe 0)
    - `items-api.ts`: Backward Compatibility Re-Export (19 Zeilen, McCabe 0)
  - **Vorteile**:
    - Klare Trennung: Fetch, Create/Delete, Convert
    - Jedes Modul < 105 Zeilen, Single Responsibility
    - Volle Backward Compatibility über Re-Exports
    - Alle bestehenden Imports funktionieren weiterhin
  - **Status**: ✅ Maximale Komplexität reduziert von 48 auf 42 (3 Dateien mit McCabe 42 verbleiben)

- **2025-12-30**: Client-Refactoring `weekplan.ts` - Modularisierung Weekplan UI
  - **Trennung**: Week Rendering, Navigation, WebSocket, Event Handlers, Init in separate Module aufgeteilt
  - **Komplexität reduziert**: McCabe 43 → 14 (67% Reduktion)
  - **Neue Struktur**:
    - `weekplan-main/week-renderer.ts`: Week rendering logic (79 Zeilen, McCabe 14)
    - `weekplan-main/event-handlers.ts`: Detail dialogs (34 Zeilen, McCabe 12)
    - `weekplan-main/initialization.ts`: Main init (42 Zeilen, McCabe 8)
    - `weekplan-main/websocket-handlers.ts`: Real-time updates (35 Zeilen, McCabe 8)
    - `weekplan-main/navigation-handlers.ts`: Previous/Next week (19 Zeilen, McCabe 2)
    - `weekplan-main/index.ts`: Public API (10 Zeilen, McCabe 0)
    - `weekplan.ts`: Backward Compatibility Re-Export (14 Zeilen, McCabe 0)
  - **Vorteile**:
    - Klare Trennung: Rendering, Navigation, WebSocket, Events, Init
    - Jedes Modul < 80 Zeilen, sehr fokussiert
    - Sehr niedrige durchschnittliche Komplexität (~7.3)
    - Volle Backward Compatibility über Re-Exports
    - Alle bestehenden Imports funktionieren weiterhin
  - **Status**: ✅ Maximale Komplexität weiterhin bei 42 (verbleibend: products-api.ts, templates-api.ts, template-modal.ts)

- **2025-12-30**: Client-Refactoring `products-api.ts` - Modularisierung Products API
  - **Trennung**: Search, Fetch, CRUD Operations in separate Module aufgeteilt
  - **Komplexität reduziert**: McCabe 42 → 25 (40% Reduktion)
  - **Neue Struktur**:
    - `products-api/crud-operations.ts`: Create/Update/Delete (111 Zeilen, McCabe 25)
    - `products-api/fetch-operations.ts`: Fetch store/dept products (58 Zeilen, McCabe 10)
    - `products-api/search-operations.ts`: Product suggestions (50 Zeilen, McCabe 7)
    - `products-api/index.ts`: Public API (6 Zeilen, McCabe 0)
    - `products-api.ts`: Backward Compatibility Re-Export (14 Zeilen, McCabe 0)
  - **Vorteile**:
    - Klare Trennung: Search, Fetch, CRUD
    - Jedes Modul < 115 Zeilen, Single Responsibility
    - Niedrige durchschnittliche Komplexität (~14)
    - Volle Backward Compatibility über Re-Exports
    - Alle bestehenden Imports funktionieren weiterhin
  - **Status**: ✅ Maximale Komplexität weiterhin bei 42 (verbleibend: templates-api.ts, template-modal.ts)

- **2025-12-30**: Client-Refactoring `templates-api.ts` - Modularisierung Templates API
  - **Trennung**: Fetch, CRUD Operations in separate Module aufgeteilt
  - **Komplexität reduziert**: McCabe 42 → 32 (24% Reduktion)
  - **Neue Struktur**:
    - `templates-api/crud-operations.ts`: Create/Update/Delete (115 Zeilen, McCabe 32)
    - `templates-api/fetch-operations.ts`: Fetch templates (60 Zeilen, McCabe 10)
    - `templates-api/index.ts`: Public API (5 Zeilen, McCabe 0)
    - `templates-api.ts`: Backward Compatibility Re-Export (12 Zeilen, McCabe 0)
  - **Vorteile**:
    - Klare Trennung: Fetch, CRUD
    - Jedes Modul < 120 Zeilen, Single Responsibility
    - Niedrige durchschnittliche Komplexität (~21)
    - Volle Backward Compatibility über Re-Exports
    - Alle bestehenden Imports funktionieren weiterhin
  - **Status**: ✅ **Nur noch 1 Datei mit McCabe 42!** (template-modal.ts verbleibend)

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
6. **Eliminate Duplication**: Identifizieren Sie duplizierte Logik und extrahieren Sie sie
7. **Single Responsibility**: Jede Funktion sollte nur eine klar definierte Aufgabe haben

### Beispiel 1 - Extract Method (merge_quantities)

**Vorher (Komplexität: 21):**
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

**Nachher (Komplexität: ~8):**
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

### Beispiel 2 - Eliminate Duplication (weekplan.py)

**Vorher (Komplexität: 21):**
```python
def _add_recipe_items_to_shopping_list(...):
    # 80 Zeilen für Rezeptzutaten
    for line in ingredient_lines:
        # ... Parse ...
        # ... Calculate date ...
        if _find_exact_product_match(...):
            existing_item = _find_existing_item_exact(...)
        else:
            existing_item = _find_existing_item(...)
        if existing_item:
            # ... Merge logic ...
        else:
            # ... Create logic ...

    # 40 Zeilen für Delta-Items (fast identisch!)
    for delta_item in deltas.added_items:
        # ... Parse ...
        # ... Calculate date ...
        if _find_exact_product_match(...):
            existing_item = _find_existing_item_exact(...)
        else:
            existing_item = _find_existing_item(...)
        # ... Gleiche Merge/Create Logik ...
```

**Nachher (Komplexität: 9):**
```python
# In routers/items.py - zentrale, wiederverwendbare Funktion!
def _find_item_by_match_strategy(session, name, shopping_date, store_id):
    """Zentrale Matching-Strategie - wiederverwendbar!"""
    if _find_exact_product_match(session, name, store_id):
        return _find_existing_item_exact(session, name, shopping_date, store_id)
    else:
        return _find_existing_item(session, name, shopping_date, store_id)

def _add_or_merge_ingredient_item(session, name, menge, shopping_date, store, modified_items):
    """Zentrale Add/Merge Logik - wiederverwendbar!"""
    existing_item = _find_item_by_match_strategy(session, name, shopping_date, store.id)
    if existing_item:
        # ... Merge logic ...
    else:
        # ... Create logic ...

# In routers/weekplan.py
def _add_recipe_items_to_shopping_list(...):
    # Nur 30 Zeilen - viel klarer!
    _process_recipe_ingredients(...)  # Nutzt _add_or_merge_ingredient_item
    _process_delta_items(...)          # Nutzt _add_or_merge_ingredient_item
```

**Vorteile:**
- Matching-Logik nur an **1 Stelle** (`routers/items.py`) statt 6+ (in `weekplan.py`)
- Add/Merge-Logik nur an **1 Stelle** statt 4+
- Jede Funktion hat eine **klare Verantwortlichkeit**
- **Bessere Modularität**: Item-Operationen gehören zu `items.py`
- **Einfacher zu testen** (kleine Funktionen)
- **Einfacher zu warten** (Änderungen nur an einer Stelle)

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
