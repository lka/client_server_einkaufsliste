"""Migration 004: Add verify_ssl column to webdavsettings table."""

import sqlite3


def run_migration(db_path: str = "./data.db") -> None:
    conn = sqlite3.connect(db_path)
    try:
        conn.execute(
            "ALTER TABLE webdavsettings ADD COLUMN verify_ssl BOOLEAN NOT NULL DEFAULT 1"
        )
        conn.commit()
        print("Migration 004: added verify_ssl to webdavsettings")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("Migration 004: verify_ssl already exists, skipping")
        else:
            raise
    finally:
        conn.close()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Migration 004: Add verify_ssl")
    parser.add_argument("--db", default="./data.db")
    args = parser.parse_args()
    run_migration(args.db)
