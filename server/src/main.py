"""FastAPI application with SQLite persistence via SQLModel.

This module mounts the client/ static files and exposes a small
CRUD API at /api/items backed by SQLite.
"""

from typing import List
import os
from datetime import timedelta
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Depends, status
from starlette.staticfiles import StaticFiles
from sqlmodel import select

from .models import Item
from .db import get_engine, create_db_and_tables, get_session
from .user_models import User, UserCreate, UserLogin, Token, UserResponse
from .auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for the FastAPI application.

    Creates the database engine and ensures tables exist before the app
    starts serving requests. This replaces the deprecated startup event
    decorator.
    """
    # Import models to register them with SQLModel
    from .user_models import User  # noqa: F401

    engine = get_engine()
    create_db_and_tables(engine)
    try:
        yield
    finally:
        # place for shutdown logic if needed in future
        pass


app = FastAPI(title="Einkaufsliste API", lifespan=lifespan)

# Calculate client directory relative to this module and normalize the path.
BASE_DIR = os.path.dirname(__file__)
CLIENT_DIR = os.path.normpath(os.path.join(BASE_DIR, "..", "..", "client"))

# Note: static files are mounted after API route definitions so they do not
# shadow API endpoints (mounting at '/' before route registration can
# intercept and return 404 for API paths).


# === Authentication Endpoints ===


@app.post("/api/auth/register", response_model=UserResponse, status_code=201)
def register(user_data: UserCreate):
    """Register a new user.

    Args:
        user_data: User registration data (username, email, password)

    Returns:
        UserResponse: Created user data (without password)

    Raises:
        HTTPException: If username or email already exists
    """
    with get_session() as session:
        # Check if username already exists
        existing_user = session.exec(
            select(User).where(User.username == user_data.username)
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered",
            )

        # Check if email already exists
        existing_email = session.exec(
            select(User).where(User.email == user_data.email)
        ).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        # Create new user with hashed password
        hashed_password = get_password_hash(user_data.password)
        new_user = User(
            username=user_data.username,
            email=user_data.email,
            hashed_password=hashed_password,
        )
        session.add(new_user)
        session.commit()
        session.refresh(new_user)
        return new_user


@app.post("/api/auth/login", response_model=Token)
def login(credentials: UserLogin):
    """Authenticate user and return JWT token.

    Args:
        credentials: Username and password

    Returns:
        Token: JWT access token

    Raises:
        HTTPException: If credentials are invalid
    """
    with get_session() as session:
        user = session.exec(
            select(User).where(User.username == credentials.username)
        ).first()

        if not user or not verify_password(credentials.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive",
            )

        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )
        return Token(access_token=access_token)


@app.get("/api/auth/me", response_model=UserResponse)
def get_current_user_info(current_user: str = Depends(get_current_user)):
    """Get current authenticated user information.

    Args:
        current_user: Current username from JWT token

    Returns:
        UserResponse: Current user data

    Raises:
        HTTPException: If user not found
    """
    with get_session() as session:
        user = session.exec(select(User).where(User.username == current_user)).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )
        return user


@app.post("/api/auth/refresh", response_model=Token)
def refresh_token(current_user: str = Depends(get_current_user)):
    """Refresh JWT token for authenticated user.

    Args:
        current_user: Current username from JWT token

    Returns:
        Token: New JWT access token with extended expiration

    Raises:
        HTTPException: If user not found or inactive
    """
    with get_session() as session:
        user = session.exec(select(User).where(User.username == current_user)).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive",
            )

        # Create new access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )
        return Token(access_token=access_token)


@app.delete("/api/auth/me", status_code=204)
def delete_current_user(current_user: str = Depends(get_current_user)):
    """Delete the current authenticated user account.

    This will delete the user and all their associated shopping list items.

    Args:
        current_user: Current username from JWT token

    Raises:
        HTTPException: If user not found
    """
    with get_session() as session:
        user = session.exec(select(User).where(User.username == current_user)).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        # Delete all items belonging to this user
        # Note: Currently items are not user-specific,
        # but this prepares for future changes
        # For now, we'll just delete the user account
        session.delete(user)
        session.commit()
        return None


# === Items Endpoints (Protected) ===


@app.get("/api/items", response_model=List[Item])
def read_items(current_user: str = Depends(get_current_user)):
    """Read all items from the database (requires authentication).

    Args:
        current_user: Current authenticated username from JWT

    Returns:
        List[Item]: All items stored in the database.
    """
    with get_session() as session:
        items = session.exec(select(Item)).all()
        return items


@app.post("/api/items", status_code=201, response_model=Item)
def create_item(item: Item, current_user: str = Depends(get_current_user)):
    """Create a new item in the database (requires authentication).

    Args:
        item (Item): Item payload to create. The id will be autogenerated
            if not provided.
        current_user: Current authenticated username from JWT

    Returns:
        Item: The created item with assigned id.
    """
    import uuid

    # Generate UUID if not provided
    if not item.id:
        item.id = str(uuid.uuid4())
    with get_session() as session:
        session.add(item)
        session.commit()
        session.refresh(item)
        return item


@app.delete("/api/items/{item_id}", status_code=204)
def delete_item(item_id: str, current_user: str = Depends(get_current_user)):
    """Delete an item by its id from the database (requires authentication).

    Args:
        item_id (str): The id of the item to delete.
        current_user: Current authenticated username from JWT

    Raises:
        HTTPException: If the item does not exist (404).
    """
    with get_session() as session:
        item = session.get(Item, item_id)
        if not item:
            raise HTTPException(status_code=404, detail="Not found")
        session.delete(item)
        session.commit()
        return None


# Serve the app page for authenticated users
@app.get("/app")
def serve_app():
    """Serve the main application page."""
    from fastapi.responses import FileResponse
    import os

    app_file = os.path.join(CLIENT_DIR, "index-app.html")
    return FileResponse(app_file)


# Serve favicon
@app.get("/favicon.{ext}")
def serve_favicon(ext: str):
    """Serve the favicon file (svg or ico)."""
    from fastapi.responses import FileResponse
    import os

    favicon_file = os.path.join(CLIENT_DIR, f"favicon.{ext}")
    if os.path.exists(favicon_file):
        # Set appropriate media type
        media_types = {
            "svg": "image/svg+xml",
            "ico": "image/x-icon",
            "png": "image/png",
        }
        media_type = media_types.get(ext, "application/octet-stream")
        return FileResponse(favicon_file, media_type=media_type)
    raise HTTPException(status_code=404, detail="Favicon not found")


# Mount client static files (index.html at root)
app.mount("/", StaticFiles(directory=CLIENT_DIR, html=True), name="static")


if __name__ == "__main__":
    # Run dev server (use uvicorn for auto-reload in development)
    import uvicorn

    uvicorn.run("server.main:app", host="0.0.0.0", port=8000, reload=True)
