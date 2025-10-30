"""Database helpers: engine and session factory."""

import os

from sqlmodel import create_engine, SQLModel, Session


# Global engine instance to ensure single engine per process
_engine = None


def get_database_url() -> str:
    """Get the database URL from environment or return SQLite default.

    Returns:
        str: Database URL, defaults to local SQLite file 'data.db'
    """
    return os.environ.get("DATABASE_URL", "sqlite:///./data.db")


def get_engine():
    """Get or create SQLAlchemy engine with appropriate configuration.

    For SQLite, enables check_same_thread=False for multithreaded access.
    Uses get_database_url() to determine connection URL.
    Reuses the same engine instance to maintain database connection.
    This is critical for in-memory SQLite databases to work correctly.

    Returns:
        Engine: Configured SQLAlchemy engine instance
    """
    global _engine
    if _engine is None:
        url = get_database_url()
        connect_args = {}
        if url.startswith("sqlite"):
            # SQLite needs this in multithreaded environments
            # For in-memory databases, same engine must be reused
            connect_args = {"check_same_thread": False}
        _engine = create_engine(url, echo=False, connect_args=connect_args)
    return _engine


def create_db_and_tables(engine=None):
    """Create all tables defined in SQLModel metadata.

    Args:
        engine: Optional SQLAlchemy engine. If None, creates new engine.
    """
    if engine is None:
        engine = get_engine()
    SQLModel.metadata.create_all(engine)


def get_session(engine=None):
    """Create a new SQLModel database session.

    Args:
        engine: Optional SQLAlchemy engine. If None, creates new engine.

    Returns:
        Session: New SQLModel session bound to the engine
    """
    if engine is None:
        engine = get_engine()
    return Session(engine)


def reset_engine():
    """Reset the global engine instance.

    Useful for testing when you need to recreate the engine with
    different configuration (e.g., switching to in-memory database).
    """
    global _engine
    _engine = None
