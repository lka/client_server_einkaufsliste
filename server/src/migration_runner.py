"""Auto-run numbered database migrations on server startup.

Tracks applied migrations in schema_migrations table.
Bootstrap: migrations 001-003 predate the runner and are marked applied without
running on first startup (they handle duplicate-column gracefully anyway).
"""

import importlib.util
import logging
import os
import sqlite3
from pathlib import Path

logger = logging.getLogger(__name__)

MIGRATIONS_DIR = Path(__file__).parent.parent / "migrations"

# Migrations that existed before the auto-runner — marked applied on first run
# without re-executing (they all handle "already exists" gracefully regardless)
BOOTSTRAP_VERSION = 3


def _db_path() -> str:
    url = os.getenv("DATABASE_URL", "sqlite:///./data.db")
    return url.replace("sqlite:///", "").replace("sqlite://", "")


def _migration_files() -> list[tuple[int, Path]]:
    if not MIGRATIONS_DIR.exists():
        return []
    result = []
    for f in sorted(MIGRATIONS_DIR.glob("*.py")):
        try:
            version = int(f.stem.split("_")[0])
            result.append((version, f))
        except (ValueError, IndexError):
            pass  # skip unnumbered files
    return result


def _run_one(path: Path, db_path: str) -> None:
    spec = importlib.util.spec_from_file_location(path.stem, path)
    module = importlib.util.module_from_spec(spec)  # type: ignore[arg-type]
    spec.loader.exec_module(module)  # type: ignore[union-attr]

    if hasattr(module, "run_migration"):
        module.run_migration(db_path)
    elif hasattr(module, "migrate"):
        module.migrate()
    else:
        raise RuntimeError(f"No run_migration() or migrate() in {path.name}")


def run_migrations() -> None:
    """Apply all pending numbered migrations from server/migrations/."""
    files = _migration_files()
    if not files:
        return

    db_path = _db_path()
    conn = sqlite3.connect(db_path)
    try:
        cur = conn.cursor()
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version  INTEGER PRIMARY KEY,
                name     TEXT NOT NULL,
                applied_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
        """
        )
        conn.commit()

        cur.execute("SELECT version FROM schema_migrations")
        applied: set[int] = {row[0] for row in cur.fetchall()}
        first_run = len(applied) == 0

        for version, path in files:
            if version in applied:
                continue

            if first_run and version <= BOOTSTRAP_VERSION:
                cur.execute(
                    "INSERT INTO schema_migrations (version, name) VALUES (?, ?)",
                    (version, path.name),
                )
                conn.commit()
                logger.info("bootstrap: marked %s as applied", path.name)
                continue

            logger.info("applying migration %s", path.name)
            try:
                _run_one(path, db_path)
                cur.execute(
                    "INSERT INTO schema_migrations (version, name) VALUES (?, ?)",
                    (version, path.name),
                )
                conn.commit()
                logger.info("migration %s applied", path.name)
            except Exception:
                logger.exception("migration %s failed", path.name)
                raise
    finally:
        conn.close()
