"""
Migration 003: Add manufacturer field to product and item tables

This migration adds an optional manufacturer column to both the product
and item tables. The manufacturer field stores the specific product designation
(e.g., "Harry's Dinkelkrüstchen" instead of generic "Brötchen") and will be
preferred over item names when printing shopping lists.
"""

import sqlite3
import sys
from pathlib import Path

# Add parent directory to path for database access
sys.path.append(str(Path(__file__).parent.parent))


def run_migration(db_path: str = "./data.db"):
    """Run the migration to add manufacturer columns."""
    print("Running migration 003: Add manufacturer field...")
    print(f"Database: {db_path}")

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Add manufacturer column to product table
        print("Adding manufacturer column to product table...")
        cursor.execute(
            """
            ALTER TABLE product ADD COLUMN manufacturer VARCHAR NULL
        """
        )

        # Add manufacturer column to item table
        print("Adding manufacturer column to item table...")
        cursor.execute(
            """
            ALTER TABLE item ADD COLUMN manufacturer VARCHAR NULL
        """
        )

        conn.commit()
        print("Migration 003 completed successfully!")
        print("  - Added manufacturer column to product table")
        print("  - Added manufacturer column to item table")

    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("WARNING: Migration already applied (columns exist)")
        else:
            print(f"ERROR: Migration failed: {e}")
            raise
    finally:
        conn.close()


def rollback_migration(db_path: str = "./data.db"):
    """Rollback the migration (remove manufacturer columns)."""
    print("Rolling back migration 003...")
    print(f"Database: {db_path}")

    conn = sqlite3.connect(db_path)

    try:
        # SQLite doesn't support DROP COLUMN directly in older versions
        # We would need to recreate tables without the column
        print("WARNING: Rollback for this migration requires manual intervention:")
        print("  ALTER TABLE product DROP COLUMN manufacturer;")
        print("  ALTER TABLE item DROP COLUMN manufacturer;")
        print("  (Note: May require table recreation on older SQLite versions)")

    finally:
        conn.close()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Migration 003: Add manufacturer field"
    )
    parser.add_argument(
        "--rollback", action="store_true", help="Rollback the migration"
    )
    parser.add_argument(
        "--db", default="./data.db", help="Path to database file (default: ./data.db)"
    )

    args = parser.parse_args()

    if args.rollback:
        rollback_migration(args.db)
    else:
        run_migration(args.db)
