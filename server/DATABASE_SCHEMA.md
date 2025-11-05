# Datenbankschema

## Übersicht

Die Einkaufsliste verwendet ein relationales Datenbankschema mit SQLModel/SQLAlchemy, das eine flexible Organisation von Produkten nach Geschäften und Abteilungen ermöglicht.

## Entity-Relationship-Diagramm

```
┌──────────────┐
│     User     │
│──────────────│
│ id (PK)      │
│ username     │
│ email        │
│ password_hash│
│ is_active    │
└──────┬───────┘
       │
       │ 1:N
       │
       ▼
┌──────────────┐        ┌──────────────┐
│     Item     │   N:1  │   Product    │
│──────────────│───────►│──────────────│
│ id (PK)      │        │ id (PK)      │
│ user_id (FK) │        │ name         │
│ product_id   │        │ store_id (FK)│
│ name         │        │ dept_id (FK) │
│ menge        │        │ default_unit │
└──────────────┘        └──────┬───────┘
                               │
                               │ N:1
                               │
                ┌──────────────▼──────────┐
                │                         │
         ┌──────▼──────┐         ┌───────▼────────┐
         │    Store    │         │   Department   │
         │─────────────│◄────────│────────────────│
         │ id (PK)     │   1:N   │ id (PK)        │
         │ name        │         │ name           │
         │ location    │         │ store_id (FK)  │
         └─────────────┘         │ sort_order     │
                                 └────────────────┘
```

## Tabellen

### 1. User (Benutzer)

Speichert Benutzerkonten für die Authentifizierung.

| Feld            | Typ          | Beschreibung                    | Constraints         |
|-----------------|--------------|---------------------------------|---------------------|
| id              | Integer      | Primärschlüssel                 | PRIMARY KEY, AUTO   |
| username        | String(50)   | Benutzername                    | UNIQUE, INDEX       |
| email           | String(100)  | E-Mail-Adresse                  | UNIQUE              |
| hashed_password | String       | Bcrypt-gehashtes Passwort       | NOT NULL            |
| is_active       | Boolean      | Account aktiv?                  | DEFAULT TRUE        |

**Beziehungen:**
- `items` → Hat viele Items (1:N)

### 2. Store (Geschäft)

Speichert Geschäfte, in denen eingekauft werden kann.

| Feld     | Typ     | Beschreibung                    | Constraints         |
|----------|---------|---------------------------------|---------------------|
| id       | Integer | Primärschlüssel                 | PRIMARY KEY, AUTO   |
| name     | String  | Geschäftsname (z.B. "Rewe")     | UNIQUE, INDEX       |
| location | String  | Optional: Standort/Adresse      | NULLABLE            |

**Beziehungen:**
- `departments` → Hat viele Abteilungen (1:N)
- `products` → Hat viele Produkte (1:N)

**Vordefinierte Stores:**
1. Rewe
2. Edeka
3. Aldi

### 3. Department (Abteilung)

Speichert Abteilungen innerhalb eines Geschäfts.

| Feld       | Typ     | Beschreibung                          | Constraints         |
|------------|---------|---------------------------------------|---------------------|
| id         | Integer | Primärschlüssel                       | PRIMARY KEY, AUTO   |
| name       | String  | Abteilungsname (z.B. "Obst & Gemüse") | INDEX               |
| store_id   | Integer | Foreign Key zu Store                  | FK, INDEX, NOT NULL |
| sort_order | Integer | Optionale Sortierreihenfolge          | NULLABLE            |

**Beziehungen:**
- `store` → Gehört zu einem Store (N:1)
- `products` → Hat viele Produkte (1:N)

**Beispiel-Abteilungen (pro Geschäft):**
1. Obst & Gemüse
2. Backwaren / Brot & Backwaren
3. Fleisch & Wurst / Fleisch & Geflügel
4. Milchprodukte / Käse & Molkerei
5. Tiefkühl / Tiefkühlkost
6. Getränke
7. Konserven & Haltbares / Grundnahrungsmittel / Vorräte
8. Süßigkeiten & Snacks / Süßwaren
9. Drogerie & Haushalt / Haushalt & Pflege / Non-Food

### 4. Product (Produkt)

Master-Produktliste mit Zuordnung zu Geschäft und Abteilung.

| Feld          | Typ     | Beschreibung                          | Constraints         |
|---------------|---------|---------------------------------------|---------------------|
| id            | Integer | Primärschlüssel                       | PRIMARY KEY, AUTO   |
| name          | String  | Produktname (z.B. "Milch")            | INDEX               |
| store_id      | Integer | Foreign Key zu Store                  | FK, INDEX, NOT NULL |
| department_id | Integer | Foreign Key zu Department             | FK, INDEX, NOT NULL |
| default_unit  | String  | Standard-Einheit (z.B. "Liter", "kg") | NULLABLE            |

**Beziehungen:**
- `store` → Gehört zu einem Store (N:1)
- `department` → Gehört zu einer Abteilung (N:1)
- `items` → Wird von vielen Items referenziert (1:N)

**Beispiel-Produkte (Rewe):**
- Äpfel (Obst & Gemüse, kg)
- Bananen (Obst & Gemüse, kg)
- Tomaten (Obst & Gemüse, kg)
- Möhren (Obst & Gemüse, kg)
- Kartoffeln (Obst & Gemüse, kg)
- Brot (Backwaren, Stück)
- Brötchen (Backwaren, Stück)
- Milch (Milchprodukte, Liter)
- Butter (Milchprodukte, Packung)
- Joghurt (Milchprodukte, Becher)
- Käse (Milchprodukte, g)
- Wasser (Getränke, Liter)
- Saft (Getränke, Liter)
- Mehl (Konserven & Haltbares, kg)
- Zucker (Konserven & Haltbares, kg)
- Nudeln (Konserven & Haltbares, Packung)
- Reis (Konserven & Haltbares, kg)

### 5. Item (Einkaufslisten-Eintrag)

Benutzerspezifische Einkaufslisten-Einträge.

| Feld       | Typ     | Beschreibung                               | Constraints         |
|------------|---------|--------------------------------------------|---------------------|
| id         | String  | UUID als Primärschlüssel (Kompatibilität)  | PRIMARY KEY         |
| user_id    | Integer | Foreign Key zu User                        | FK, INDEX, NULLABLE |
| product_id | Integer | Optional: Foreign Key zu Product           | FK, INDEX, NULLABLE |
| name       | String  | Item-Name (kann Produkt überschreiben)     | NOT NULL            |
| menge      | String  | Optional: Menge (z.B. "500 g", "2 Stück")  | NULLABLE            |

**Beziehungen:**
- `user` → Gehört zu einem User (N:1)
- `product` → Referenziert optional ein Product (N:1)

**Besonderheiten:**
- `product_id` ist optional - erlaubt freie Text-Eingaben ohne Produktzuordnung
- `name` kann den Produktnamen überschreiben für individuelle Anpassungen
- `menge` unterstützt kommagetrennte Listen: "500 g, 2 Packungen"

## Datenzugriffsschicht

### Benutzerspezifische Items

**Wichtig:** Items sind benutzerspezifisch. Jeder User sieht nur seine eigenen Items.

```python
# Items eines Users abrufen
items = session.exec(
    select(Item).where(Item.user_id == user.id)
).all()

# Item erstellen
item.user_id = user.id
session.add(item)
session.commit()

# Item löschen (nur eigene Items)
item = session.get(Item, item_id)
if item and item.user_id == user.id:
    session.delete(item)
```

### Fuzzy Matching

Items desselben Users werden automatisch zusammengeführt, wenn sie ähnlich sind:

```python
def find_similar_item(session, item_name: str, user_id: int, threshold: float = 0.8):
    """Findet ähnliche Items nur für einen spezifischen User."""
    all_items = session.exec(
        select(Item).where(Item.user_id == user_id)
    ).all()

    # SequenceMatcher für Ähnlichkeitsberechnung
    # Normalisierung: lowercase, Umlaut-Ersetzung
    # Threshold: 0.8 (80% Ähnlichkeit)
```

**Beispiele:**
- "Möhre" → "Möhren" (Singular/Plural)
- "Moehre" → "Möhren" (alternative Schreibweise)
- "Kartoffel" → "Kartoffeln" (Singular/Plural)

### Smart Quantity Merging

Mengen werden intelligent zusammengeführt:

```python
def merge_quantities(existing: str, new: str) -> str:
    """
    Beispiele:
    - "500 g" + "300 g" = "800 g"
    - "500 g" + "2 Packungen" = "500 g, 2 Packungen"
    - "500 g, 2 Packungen" + "300 g" = "800 g, 2 Packungen"
    - "2, 500 g" → ["2", "500 g"] (kommagetrennte Eingabe)
    """
```

## Seed-Daten

Die Datenbank wird beim ersten Start automatisch mit Beispieldaten gefüllt:

```python
from server.src.seed_data import seed_database

# In main.py beim Startup:
seed_database(engine)
```

**Umfang der Seed-Daten:**
- 3 Stores (Rewe, Edeka, Aldi)
- 27 Departments (9 pro Store)
- 17 Products (für Rewe)

Die Seed-Funktion prüft, ob bereits Daten vorhanden sind und überspringt das Seeding in diesem Fall.

## Migrations

Das Schema wird automatisch beim Start erstellt:

```python
from server.src.db import create_db_and_tables

# Erstellt alle Tabellen basierend auf den SQLModel-Definitionen
create_db_and_tables(engine)
```

**Für Produktion:**
- Alembic für Migrations empfohlen
- Backup vor Schema-Änderungen
- Staging-Umgebung für Tests

## Performance-Überlegungen

### Indizes

Die folgenden Felder haben Indizes für schnelle Abfragen:

- `user.username` (UNIQUE INDEX)
- `store.name` (UNIQUE INDEX)
- `department.name`, `department.store_id`
- `product.name`, `product.store_id`, `product.department_id`
- `item.user_id`, `item.product_id`

### Abfrage-Optimierung

**Effizient:**
```python
# Mit Index
items = session.exec(
    select(Item).where(Item.user_id == user_id)
).all()

# Mit Eager Loading
products = session.exec(
    select(Product)
    .options(selectinload(Product.department))
    .where(Product.store_id == store_id)
).all()
```

**Ineffizient (N+1 Problem):**
```python
# Vermeiden: Einzelne Queries pro Item
for item in items:
    product = session.get(Product, item.product_id)  # N+1!
```

## Datenintegrität

### Foreign Key Constraints

SQLite unterstützt Foreign Keys (müssen aktiviert sein):

```python
# In db.py wird PRAGMA foreign_keys = ON empfohlen
```

### Cascade-Verhalten

**Bei User-Löschung:**
- Items werden NICHT automatisch gelöscht (manuell in Code)
- Ermöglicht Kontrolle über Datenbereinigung

**Bei Store-Löschung:**
- Departments sollten CASCADE gelöscht werden
- Products sollten CASCADE gelöscht werden

**Bei Product-Löschung:**
- Items behalten ihre `product_id` (NULL erlaubt)
- Oder Items werden zu freien Text-Items

## Test-Datenbank

Für Tests wird eine In-Memory-Datenbank verwendet:

```python
# In conftest.py
os.environ["DATABASE_URL"] = "sqlite:///file::memory:?mode=memory&cache=shared&uri=true"
```

**Vorteile:**
- Schnell (im RAM)
- Isoliert (keine Konflikte)
- Wiederholbar (jedes Mal frisch)
- Automatisches Seeding für Tests

## Sicherheit

### SQL Injection

SQLModel/SQLAlchemy schützt automatisch:

```python
# Sicher - parametrisierte Queries
items = session.exec(
    select(Item).where(Item.name == user_input)
).all()
```

### Zugriffskontrolle

Alle Item-Operationen prüfen `user_id`:

```python
# Nur eigene Items abrufen
items = session.exec(
    select(Item).where(Item.user_id == current_user.id)
).all()

# Nur eigene Items löschen
item = session.get(Item, item_id)
if not item or item.user_id != current_user.id:
    raise HTTPException(status_code=404)
```

## Erweiterungsmöglichkeiten

### Zukünftige Features

1. **Mehrere Stores pro Produkt:**
   - Zwischentabelle `product_store_availability`
   - Preisvergleich zwischen Stores

2. **Produktkategorien:**
   - Zusätzliche Taxonomie über Departments hinaus
   - Tags für Filterung (bio, vegan, etc.)

3. **Einkaufslisten-Templates:**
   - Wiederverwendbare Listen
   - Teilen zwischen Benutzern

4. **Produkthistorie:**
   - Häufigkeit von Käufen
   - Vorschläge basierend auf Historie

5. **Barcode-Support:**
   - EAN-Feld in Product
   - Scanner-Integration

6. **Store-Standorte:**
   - Geo-Koordinaten
   - Nächstes Geschäft finden
