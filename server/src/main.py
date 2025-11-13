"""FastAPI application with SQLite persistence via SQLModel.

This module mounts the client/ static files and exposes a small
CRUD API at /api/items backed by SQLite.
"""

import os
import readenv.loads
from contextlib import asynccontextmanager

from fastapi import FastAPI
from starlette.staticfiles import StaticFiles

from .db import get_engine, create_db_and_tables
from .routers import auth, users, stores, products, items, pages, templates, backup
from .routers.stores import departments_router


readenv.loads  # Load .env file


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for the FastAPI application.

    Creates the database engine and ensures tables exist before the app
    starts serving requests. This replaces the deprecated startup event
    decorator.
    """
    # Import models to register them with SQLModel
    from .user_models import User  # noqa: F401
    from .models import Store, Department, Product  # noqa: F401

    engine = get_engine()
    create_db_and_tables(engine)

    # Seed database with initial data if empty
    from .seed_data import seed_database

    seed_database(engine)

    # Create or update admin user from .env
    from .admin_setup import create_or_update_admin_user
    from .user_cleanup import cleanup_expired_users
    from sqlmodel import Session

    with Session(engine) as session:
        try:
            create_or_update_admin_user(session)
        except ValueError as e:
            print(f"Warning: {e}")

        # Cleanup expired unapproved users
        cleanup_expired_users(session)

    try:
        yield
    finally:
        # place for shutdown logic if needed in future
        pass


app = FastAPI(title="Einkaufsliste API", lifespan=lifespan)

# Calculate client directory relative to this module and normalize the path.
BASE_DIR = os.path.dirname(__file__)
CLIENT_DIR = os.path.normpath(os.path.join(BASE_DIR, "..", "..", "client"))

# Register routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(stores.router)
app.include_router(departments_router)
app.include_router(products.router)
app.include_router(items.router)
app.include_router(templates.router)
app.include_router(backup.router)
app.include_router(pages.router)

# Mount client static files (index.html at root)
# Note: static files are mounted after API route definitions so they do not
# shadow API endpoints (mounting at '/' before route registration can
# intercept and return 404 for API paths).
app.mount("/", StaticFiles(directory=CLIENT_DIR, html=True), name="static")


if __name__ == "__main__":
    # Run dev server (use uvicorn for auto-reload in development)
    import uvicorn

    uvicorn.run("server.src.main:app", host="0.0.0.0", port=8000, reload=True)
