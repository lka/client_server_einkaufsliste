# Rezept-Integration Features

## Server-seitige Änderungen

### Neue Dateien:
- `server/src/models.py`: Erweitert um `Recipe` Model
- `server/src/routers/recipes.py`: Neue Router für Rezept-Endpunkte
- `server/src/routers/weekplan.py`: Erweitert um Rezept-Helper-Funktionen:
  - `_get_known_units()`: Liste bekannter Mengeneinheiten
  - `_parse_recipe_data()`: Parst Rezept-JSON (Zutaten, Personenanzahl)
  - `_create_ingredient_pattern()`: Regex für Zutaten-Parsing
  - `_parse_ingredient_line()`: Parst einzelne Zutat in Menge + Name
  - `_add_recipe_items_to_shopping_list()`: Fügt Rezeptzutaten zur Einkaufsliste hinzu
  - `_remove_recipe_items_from_shopping_list()`: Entfernt Rezeptzutaten intelligent
  - `_handle_recipe_person_count_change()`: Behandelt Personenanzahl-Änderungen
  - `_remove_newly_marked_recipe_items()`: Entfernt neu deaktivierte Items
  - `_add_back_unmarked_recipe_items()`: Fügt reaktivierte Items wieder hinzu

### Bekannte Einheiten (known_units):
```python
["g", "kg", "ml", "l", "EL", "TL", "Prise", "Prisen",
 "Stück", "Stk", "Bund", "Becher", "Dose", "Dosen",
 "Pck", "Päckchen", "Tasse", "Tassen",
 "Stiel", "Stiele", "Zweig", "Zweige"]
```

## Tests

### Bestehende Tests unverändert:
- Alle 78 Server-Tests bestehen weiterhin
- Keine Breaking Changes in bestehenden Features
- Code mit black formatiert, keine flake8 Fehler

### Zu erweiternde Tests (zukünftig):
- Recipe API Endpunkte (search, fetch by ID/name)
- WebDAV Recipe Import (Mock-Tests)
- Ingredient Parsing (Regex-Tests mit verschiedenen Formaten)
- Person Count Scaling (Mengenberechnung)
- Delta Management (Add/Remove/Update Zutaten)
