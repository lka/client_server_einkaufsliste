"""Migration: Add units table and seed with known measurement units.

This migration:
1. Creates the unit table with columns: id, name, sort_order
2. Seeds it with the known units in the exact order from the
   previous _get_known_units() function
"""

import sqlite3
from pathlib import Path


def get_db_path():
    """Get the database file path."""
    server_dir = Path(__file__).parent.parent
    return server_dir / "data.db"


def migrate():
    """Run the migration to add the units table."""
    db_path = get_db_path()

    if not db_path.exists():
        print(f"Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Check if unit table already exists
        cursor.execute(
            """
            SELECT name FROM sqlite_master
            WHERE type='table' AND name='unit'
        """
        )

        if cursor.fetchone():
            print("Unit table already exists, skipping creation")
        else:
            # Create unit table
            cursor.execute(
                """
                CREATE TABLE unit (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name VARCHAR NOT NULL UNIQUE,
                    sort_order INTEGER NOT NULL DEFAULT 0
                )
            """
            )

            # Create index on name
            cursor.execute(
                """
                CREATE INDEX ix_unit_name ON unit (name)
            """
            )

            print("Created unit table")

        # Check if units are already seeded
        cursor.execute("SELECT COUNT(*) FROM unit")
        count = cursor.fetchone()[0]

        if count > 0:
            print(f"Unit table already has {count} entries, skipping seeding")
        else:
            # Seed units in the exact order from _get_known_units()
            units = [
                "g",
                "kg",
                "ml",
                "l",
                "L",
                "EL",
                "El",
                "TL",
                "Tl",
                "Prise",
                "Prisen",
                "Stück",
                "Stk",
                "Stk.",
                "Bund",
                "Becher",
                "Dose",
                "Dosen",
                "Pck",
                "Päckchen",
                "Tasse",
                "Tassen",
                "Stiel",
                "Stiele",
                "Zweig",
                "Zweige",
                "rote",
                "grüne",
                "gelbe",
            ]

            for idx, unit_name in enumerate(units):
                cursor.execute(
                    "INSERT INTO unit (name, sort_order) VALUES (?, ?)",
                    (unit_name, idx),
                )

            print(f"Seeded {len(units)} units")

        conn.commit()
        print("Migration completed successfully")

    except Exception as e:
        conn.rollback()
        print(f"Migration failed: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    migrate()
