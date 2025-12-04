"""Migration script to add recipe_id column to weekplan_entry table."""

import sqlite3
import sys


def migrate():
    """Add recipe_id column to weekplan_entry table."""
    conn = sqlite3.connect("server/data.db")
    cursor = conn.cursor()

    try:
        # Check if column already exists
        cursor.execute("PRAGMA table_info(weekplanentry)")
        columns = [row[1] for row in cursor.fetchall()]

        if "recipe_id" in columns:
            print("Column 'recipe_id' already exists. No migration needed.")
            return

        # Add the column
        print("Adding 'recipe_id' column to weekplanentry table...")
        cursor.execute("ALTER TABLE weekplanentry ADD COLUMN recipe_id INTEGER")
        conn.commit()
        print("Migration completed successfully!")

    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
        sys.exit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    migrate()
