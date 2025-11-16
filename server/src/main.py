"""FastAPI application with SQLite persistence via SQLModel.

This module mounts the client/ static files and exposes a small
CRUD API at /api/items backed by SQLite.
"""

import os
import readenv.loads
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from starlette.staticfiles import StaticFiles

from .db import get_engine, create_db_and_tables, get_session
from .routers import auth, users, stores, products, items, pages, templates, backup
from .routers.stores import departments_router
from .version import get_version
from .websocket_manager import manager
from .auth import verify_token
from .user_models import User
from sqlmodel import select


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


@app.get("/api/version")
def get_api_version():
    """Get the current API version.

    Returns:
        dict: Version information including semantic version and build metadata
    """
    return {
        "version": get_version(),
        "api": "v1",
    }


@app.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
    """WebSocket endpoint for real-time updates.

    Args:
        websocket: WebSocket connection
        token: JWT authentication token

    Handles:
        - User authentication via JWT token
        - Real-time item add/delete/update events
        - Ping/pong heartbeat
        - Connection/disconnection events
    """
    # Authenticate user and get from database
    username = verify_token(token)
    if username is None:
        await websocket.close(code=1008, reason="Authentication failed: Invalid token")
        return

    # Fetch user from database
    with get_session() as session:
        user = session.exec(select(User).where(User.username == username)).first()
        if not user:
            await websocket.close(
                code=1008, reason="Authentication failed: User not found"
            )
            return

        user_id = user.id

    # Connect user
    await manager.connect(websocket, user_id)

    try:
        while True:
            # Receive message from client
            data = await websocket.receive_json()

            # Handle different event types
            event_type = data.get("type")

            if event_type == "ping":
                # Respond to heartbeat ping
                await websocket.send_json({"type": "pong", "data": {}})

            elif event_type == "item:add":
                # Broadcast item added to other users
                await manager.broadcast(
                    {
                        "type": "item:added",
                        "data": data.get("data"),
                        "timestamp": data.get("timestamp"),
                        "userId": user_id,
                    },
                    exclude_user=user_id,
                )

            elif event_type == "item:delete":
                # Broadcast item deleted to other users
                await manager.broadcast(
                    {
                        "type": "item:deleted",
                        "data": data.get("data"),
                        "timestamp": data.get("timestamp"),
                        "userId": user_id,
                    },
                    exclude_user=user_id,
                )

            elif event_type == "item:update":
                # Broadcast item updated to other users
                await manager.broadcast(
                    {
                        "type": "item:updated",
                        "data": data.get("data"),
                        "timestamp": data.get("timestamp"),
                        "userId": user_id,
                    },
                    exclude_user=user_id,
                )

    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)

        # Broadcast user left event
        await manager.broadcast(
            {"type": "user:left", "data": {"userId": user_id}},
            exclude_user=user_id,
        )
    except Exception as e:
        print(f"WebSocket error for user {user_id}: {e}")
        manager.disconnect(websocket, user_id)


# Mount client static files (index.html at root)
# Note: static files are mounted after API route definitions so they do not
# shadow API endpoints (mounting at '/' before route registration can
# intercept and return 404 for API paths).
app.mount("/", StaticFiles(directory=CLIENT_DIR, html=True), name="static")


if __name__ == "__main__":
    # Run dev server (use uvicorn for auto-reload in development)
    import uvicorn

    uvicorn.run("server.src.main:app", host="0.0.0.0", port=8000, reload=True)
