"""Migration script to add entry_type and template_id columns to weekplanentry table."""

import sqlite3
import sys


def migrate():
    """Add entry_type and template_id columns to weekplanentry table."""
    conn = sqlite3.connect("server/data.db")
    cursor = conn.cursor()

    try:
        # Check which columns exist
        cursor.execute("PRAGMA table_info(weekplanentry)")
        columns = [row[1] for row in cursor.fetchall()]

        changes_made = False

        # Add entry_type column if it doesn't exist
        if "entry_type" not in columns:
            print("Adding 'entry_type' column to weekplanentry table...")
            cursor.execute(
                "ALTER TABLE weekplanentry ADD COLUMN entry_type VARCHAR DEFAULT 'text'"
            )
            changes_made = True
        else:
            print("Column 'entry_type' already exists.")

        # Add template_id column if it doesn't exist
        if "template_id" not in columns:
            print("Adding 'template_id' column to weekplanentry table...")
            cursor.execute("ALTER TABLE weekplanentry ADD COLUMN template_id INTEGER")
            changes_made = True
        else:
            print("Column 'template_id' already exists.")

        if changes_made:
            conn.commit()
            print("Migration completed successfully!")
        else:
            print("No migration needed - all columns already exist.")

    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
        sys.exit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    migrate()
