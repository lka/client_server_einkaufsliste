"""Pytest configuration and fixtures."""

import os
import pytest

# Set test database URL before any imports
# Use a shared in-memory database so all connections see the same data
os.environ["DATABASE_URL"] = "sqlite:///file::memory:?mode=memory&cache=shared&uri=true"


@pytest.fixture(scope="module", autouse=True)
def setup_test_database():
    """Set up test database with tables before running tests."""
    from server.src.db import reset_engine, get_engine, create_db_and_tables
    from server.src.models import Item  # noqa: F401 - ensure model is registered
    from server.src.user_models import User  # noqa: F401 - ensure model is registered

    # Reset engine to pick up test DATABASE_URL
    reset_engine()

    # Create engine and tables
    engine = get_engine()
    create_db_and_tables(engine)

    yield

    # Cleanup
    reset_engine()
