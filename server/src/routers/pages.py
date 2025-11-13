"""Static page serving endpoints."""

import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

# Calculate client directory relative to this module and normalize the path.
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
CLIENT_DIR = os.path.normpath(os.path.join(BASE_DIR, "..", "..", "client"))

router = APIRouter(tags=["pages"])


@router.get("/app")
def serve_app():
    """Serve the main application page."""
    app_file = os.path.join(CLIENT_DIR, "index-app.html")
    return FileResponse(app_file)


@router.get("/stores")
def serve_stores_page():
    """Serve the stores management page."""
    stores_file = os.path.join(CLIENT_DIR, "index-stores.html")
    return FileResponse(stores_file)


@router.get("/products")
def serve_products_page():
    """Serve the products management page."""
    products_file = os.path.join(CLIENT_DIR, "index-products.html")
    return FileResponse(products_file)


@router.get("/users")
def serve_users_page():
    """Serve the users management page."""
    users_file = os.path.join(CLIENT_DIR, "index-users.html")
    return FileResponse(users_file)


@router.get("/templates")
def serve_templates_page():
    """Serve the templates management page."""
    templates_file = os.path.join(CLIENT_DIR, "index-templates.html")
    return FileResponse(templates_file)


@router.get("/backup")
def serve_backup_page():
    """Serve the database backup management page."""
    backup_file = os.path.join(CLIENT_DIR, "index-backup.html")
    return FileResponse(backup_file)


@router.get("/favicon.{ext}")
def serve_favicon(ext: str):
    """Serve the favicon file (svg or ico)."""
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
