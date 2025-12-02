"""Migration: Add person_count column to shoppingtemplate table.

This migration adds a person_count column to the shoppingtemplate table
with a default value of 2.

Run this script manually if you have an existing database:
    python server/migrations/add_person_count_to_template.py

Or from project root:
    python -m server.migrations.add_person_count_to_template
"""

import sqlite3
import os
import sys


def migrate():
    """Add person_count column to shoppingtemplate table."""
    # Get database path - try multiple locations
    possible_paths = [
        "server/data.db",  # From project root
        "data.db",  # From server directory
        "../data.db",  # One level up
    ]

    db_path = None
    for path in possible_paths:
        if os.path.exists(path):
            db_path = path
            break

    # Check environment variable as fallback
    if not db_path:
        db_url = os.getenv("DATABASE_URL", "sqlite:///./data.db")
        db_path = db_url.replace("sqlite:///", "").replace("sqlite://", "")
        if not os.path.exists(db_path):
            db_path = None

    if not db_path:
        print("Database file not found in common locations.")
        print("Migration not needed - database will be created with new schema.")
        return True

    print(f"Migrating database: {db_path}")

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Check if column already exists
        cursor.execute("PRAGMA table_info(shoppingtemplate)")
        columns = [row[1] for row in cursor.fetchall()]

        if "person_count" in columns:
            print("OK: Column 'person_count' already exists. " "Migration not needed.")

            # Show current templates
            cursor.execute("SELECT id, name, person_count FROM shoppingtemplate")
            templates = cursor.fetchall()
            print(f"\nTemplates in database: {len(templates)}")
            for t in templates:
                print(f"  [{t[0]}] {t[1]} - {t[2]} persons")

            conn.close()
            return True

        # Add person_count column with default value of 2
        print("Adding person_count column...")
        cursor.execute(
            "ALTER TABLE shoppingtemplate ADD COLUMN "
            "person_count INTEGER DEFAULT 2 NOT NULL"
        )
        conn.commit()
        print(
            "OK: Successfully added 'person_count' column to " "shoppingtemplate table."
        )

        # Show updated templates
        cursor.execute("SELECT id, name, person_count FROM shoppingtemplate")
        templates = cursor.fetchall()
        print(f"\nTemplates in database: {len(templates)}")
        for t in templates:
            print(f"  [{t[0]}] {t[1]} - {t[2]} persons")

        conn.close()
        return True

    except sqlite3.Error as e:
        print(f"ERROR: Migration failed: {e}")
        if "conn" in locals():
            conn.rollback()
            conn.close()
        return False


if __name__ == "__main__":
    success = migrate()
    sys.exit(0 if success else 1)
