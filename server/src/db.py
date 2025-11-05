"""Database utilities for SQLModel with SQLite.

This module provides database connection management and session handling.
"""

import os
from contextlib import contextmanager
from typing import Generator

from sqlmodel import SQLModel, Session, create_engine
from sqlalchemy import Engine


# Global engine instance
_engine: Engine | None = None


def get_engine() -> Engine:
    """Get or create the database engine.

    Returns:
        Engine: SQLAlchemy engine instance
    """
    global _engine

    if _engine is None:
        # Get DATABASE_URL from environment or use default
        database_url = os.getenv("DATABASE_URL", "sqlite:///./data.db")

        # Create engine with connection args for SQLite
        connect_args = (
            {"check_same_thread": False} if database_url.startswith("sqlite") else {}
        )

        _engine = create_engine(
            database_url,
            echo=False,  # Set to True for SQL query logging
            connect_args=connect_args,
        )

    return _engine


def reset_engine() -> None:
    """Reset the global engine instance.

    Useful for testing to ensure a fresh engine with new DATABASE_URL.
    """
    global _engine
    _engine = None


def create_db_and_tables(engine: Engine | None = None) -> None:
    """Create all database tables.

    Args:
        engine: Optional engine to use. If None, uses default engine.
    """
    if engine is None:
        engine = get_engine()

    SQLModel.metadata.create_all(engine)


@contextmanager
def get_session(engine: Engine | None = None) -> Generator[Session, None, None]:
    """Context manager for database sessions.

    Args:
        engine: Optional engine to use. If None, uses default engine.

    Yields:
        Session: SQLModel session for database operations

    Example:
        with get_session() as session:
            items = session.exec(select(Item)).all()
    """
    if engine is None:
        engine = get_engine()

    with Session(engine) as session:
        yield session
