"""WebDAV settings management endpoints."""

import json
import logging
import zipfile
from io import BytesIO
from typing import List
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from sqlmodel import select
import requests
from requests.auth import HTTPBasicAuth

from ..models import WebDAVSettings, Recipe
from ..db import get_session
from ..auth import get_current_user
from ..schemas import WebDAVSettingsCreate, WebDAVSettingsUpdate

router = APIRouter(prefix="/api/webdav", tags=["webdav"])
logger = logging.getLogger(__name__)


@router.get("", response_model=List[WebDAVSettings])
def get_webdav_settings(current_user: str = Depends(get_current_user)):
    """Get all WebDAV settings (requires authentication).

    Args:
        current_user: Current authenticated username from JWT

    Returns:
        List[WebDAVSettings]: All WebDAV settings in the database
    """
    with get_session() as session:
        settings = session.exec(select(WebDAVSettings)).all()
        return settings


@router.get("/{settings_id}", response_model=WebDAVSettings)
def get_webdav_setting(settings_id: int, current_user: str = Depends(get_current_user)):
    """Get a specific WebDAV setting by ID (requires authentication).

    Args:
        settings_id: Settings ID
        current_user: Current authenticated username from JWT

    Returns:
        WebDAVSettings: The requested WebDAV settings

    Raises:
        HTTPException: If settings not found
    """
    with get_session() as session:
        settings = session.get(WebDAVSettings, settings_id)
        if not settings:
            raise HTTPException(status_code=404, detail="WebDAV settings not found")
        return settings


@router.post("", response_model=WebDAVSettings, status_code=201)
def create_webdav_settings(
    settings_data: WebDAVSettingsCreate, current_user: str = Depends(get_current_user)
):
    """Create new WebDAV settings (requires authentication).

    Args:
        settings_data: WebDAV settings creation data
        current_user: Current authenticated username from JWT

    Returns:
        WebDAVSettings: The created settings
    """
    with get_session() as session:
        settings = WebDAVSettings(
            url=settings_data.url,
            username=settings_data.username,
            password=settings_data.password,
            filename=settings_data.filename,
        )
        session.add(settings)
        session.commit()
        session.refresh(settings)
        return settings


@router.put("/{settings_id}", response_model=WebDAVSettings)
def update_webdav_settings(
    settings_id: int,
    settings_data: WebDAVSettingsUpdate,
    current_user: str = Depends(get_current_user),
):
    """Update WebDAV settings (requires authentication).

    Args:
        settings_id: Settings ID
        settings_data: WebDAV settings update data
        current_user: Current authenticated username from JWT

    Returns:
        WebDAVSettings: The updated settings

    Raises:
        HTTPException: If settings not found
    """
    with get_session() as session:
        settings = session.get(WebDAVSettings, settings_id)
        if not settings:
            raise HTTPException(status_code=404, detail="WebDAV settings not found")

        # Update only provided fields
        if settings_data.url is not None:
            settings.url = settings_data.url
        if settings_data.username is not None:
            settings.username = settings_data.username
        if settings_data.password is not None:
            settings.password = settings_data.password
        if settings_data.filename is not None:
            settings.filename = settings_data.filename
        if settings_data.enabled is not None:
            settings.enabled = settings_data.enabled

        session.add(settings)
        session.commit()
        session.refresh(settings)
        return settings


@router.delete("/{settings_id}", status_code=204)
def delete_webdav_settings(
    settings_id: int, current_user: str = Depends(get_current_user)
):
    """Delete WebDAV settings (requires authentication).

    Args:
        settings_id: Settings ID
        current_user: Current authenticated username from JWT

    Raises:
        HTTPException: If settings not found
    """
    with get_session() as session:
        settings = session.get(WebDAVSettings, settings_id)
        if not settings:
            raise HTTPException(status_code=404, detail="WebDAV settings not found")

        session.delete(settings)
        session.commit()
        return None


def _read_deleted_recipes(zip_file: zipfile.ZipFile, errors: list) -> set:
    """Read deleted recipes from status.json (Helper Function).

    Args:
        zip_file (zipfile.ZipFile): Opened ZIP file
        errors (list): List to append error messages

    Returns:
        set: Set of deleted recipe IDs from status.json
    """
    deleted_recipe_ids = set()
    if "status.json" in zip_file.namelist():
        try:
            status_content = zip_file.read("status.json")
            status_data = json.loads(status_content)
            deleted_recipes = status_data.get("deletedRecipes", [])
            deleted_recipe_ids = set(deleted_recipes.split(";"))
        except Exception as e:
            errors.append(f"Failed to read status.json: {str(e)}")
    return deleted_recipe_ids


# Read categories and tags for enrichment (future use)
def _read_categories_and_tags(zip_file: zipfile.ZipFile, errors: list) -> tuple:
    """Read categories and tags from ZIP file (Helper Function).

    Args:
        zip_file (zipfile.ZipFile): Opened ZIP file
        errors (list): List to append error messages
    Returns:
        tuple: (categories, tags) as lists
    """
    categories = []
    tags = []

    if "categories.json" in zip_file.namelist():
        try:
            categories_content = zip_file.read("categories.json")
            categories = json.loads(categories_content)
        except Exception as e:
            errors.append(f"Failed to read categories: {str(e)}")

    if "tags.json" in zip_file.namelist():
        try:
            tags_content = zip_file.read("tags.json")
            tags = json.loads(tags_content)
        except Exception as e:
            errors.append(f"Failed to read tags: {str(e)}")

    return categories, tags


# Skip recipes that are in deletedRecipes
def _skip_deleted_recipes(
    recipe_id: str, deleted_recipe_ids: set, session, deleted_count: int
) -> int:
    """Skip and delete recipes that are in deletedRecipes (Helper Function).

    Args:
        recipe_id (str): Recipe external ID
        deleted_recipe_ids (set): Set of deleted recipe IDs
        session: Database session
        deleted_count (int): Current count of deleted recipes
    Returns:
        int: Updated count of deleted recipes
    """
    if recipe_id in deleted_recipe_ids:
        existing = session.exec(
            select(Recipe).where(Recipe.external_id == recipe_id)
        ).first()
        if existing:
            session.delete(existing)
            deleted_count += 1
    return deleted_count


# Extract recipe information
def _extract_recipe_info(recipe_data: dict) -> tuple:
    """Extract recipe information from recipe data (Helper Function).

    Args:
        recipe_data (dict): Recipe data dictionary
    Returns:
        tuple: (recipe_id, recipe_name, category, recipe_tags)
    """
    # Use uuid or id as external identifier
    recipe_id = recipe_data.get("uuid", recipe_data.get("id", ""))

    # Use title or name as recipe name
    recipe_name = recipe_data.get("title", recipe_data.get("name", "Unnamed Recipe"))

    # Extract category (can be string or array)
    category_data = recipe_data.get("categories", recipe_data.get("category", ""))
    if isinstance(category_data, list) and len(category_data) > 0:
        category = category_data[0] if isinstance(category_data[0], str) else ""
    else:
        category = category_data if isinstance(category_data, str) else ""

    # Extract tags
    recipe_tags = recipe_data.get("tags", [])

    return recipe_id, recipe_name, category, recipe_tags


@router.post("/{settings_id}/import", status_code=200)
def import_recipes_from_webdav(
    settings_id: int, current_user: str = Depends(get_current_user)
):
    """Import recipes from WebDAV server using specified settings with progress updates.

    Args:
        settings_id: WebDAV settings ID to use for import
        current_user: Current authenticated username from JWT

    Returns:
        StreamingResponse: Server-Sent Events stream with progress updates

    Raises:
        HTTPException: If settings not found or import fails
    """

    def generate_progress():
        """Generator function for Server-Sent Events."""
        with get_session() as session:
            settings = session.get(WebDAVSettings, settings_id)
            if not settings:
                yield f"data: {json.dumps({'error': 'WebDAV settings not found'})}\n\n"
                return

            if not settings.enabled:
                error_msg = json.dumps({"error": "WebDAV settings are disabled"})
                yield f"data: {error_msg}\n\n"
                return

            try:
                # Download ZIP file from WebDAV
                download_msg = json.dumps(
                    {
                        "status": "downloading",
                        "message": "Downloading recipe file...",
                    }
                )
                yield f"data: {download_msg}\n\n"

                webdav_url = f"{settings.url.rstrip('/')}/{settings.filename}"
                response = requests.get(
                    webdav_url,
                    auth=HTTPBasicAuth(settings.username, settings.password),
                    timeout=30,
                )

                if response.status_code == 401:
                    error_msg = json.dumps({"error": "WebDAV authentication failed"})
                    yield f"data: {error_msg}\n\n"
                    return

                if response.status_code != 200:
                    error_msg = json.dumps(
                        {
                            "error": f"Failed to download file: "
                            f"{response.status_code}"
                        }
                    )
                    yield f"data: {error_msg}\n\n"
                    return

                # Extract ZIP file
                extract_msg = json.dumps(
                    {
                        "status": "extracting",
                        "message": "Extracting ZIP file...",
                    }
                )
                yield f"data: {extract_msg}\n\n"

                zip_data = BytesIO(response.content)
                imported_count = 0
                deleted_count = 0
                errors = []

                with zipfile.ZipFile(zip_data, "r") as zip_file:
                    # Get list of all recipe files
                    recipe_files = [
                        f for f in zip_file.namelist() if f.startswith("recipes_")
                    ]

                    total_files = len(recipe_files)
                    found_msg = json.dumps(
                        {
                            "status": "processing",
                            "message": f"Found {total_files} recipe files",
                            "total": total_files,
                            "current": 0,
                        }
                    )
                    yield f"data: {found_msg}\n\n"

                    # Read deleted recipes from status.json
                    deleted_recipe_ids = _read_deleted_recipes(zip_file, errors)
                    for drid in deleted_recipe_ids:
                        deleted_count = _skip_deleted_recipes(
                            str(drid),
                            deleted_recipe_ids,
                            session,
                            deleted_count,
                        )

                    # Read categories and tags for enrichment (future use)
                    _categories_content, _tags_content = _read_categories_and_tags(
                        zip_file, errors
                    )

                    # Import recipes from all recipe files
                    for file_index, recipe_file in enumerate(recipe_files, 1):
                        progress_msg = json.dumps(
                            {
                                "status": "processing",
                                "message": f"Processing file "
                                f"{file_index}/{total_files}",
                                "total": total_files,
                                "current": file_index,
                                "imported": imported_count,
                            }
                        )
                        yield f"data: {progress_msg}\n\n"
                        try:
                            content = zip_file.read(recipe_file)
                            recipes_list = json.loads(content)

                            # Handle both single recipe and list of recipes
                            if isinstance(recipes_list, dict):
                                recipes_list = [recipes_list]

                            for recipe_data in recipes_list:
                                try:
                                    # Extract recipe information
                                    recipe_id, recipe_name, category, recipe_tags = (
                                        _extract_recipe_info(recipe_data)
                                    )

                                    # Skip recipes that are in deletedRecipes
                                    if str(recipe_id) in deleted_recipe_ids:
                                        logger.debug(
                                            "Skipping deleted recipe: %s (ID: %s)",
                                            recipe_name,
                                            recipe_id,
                                        )
                                        deleted_count = _skip_deleted_recipes(
                                            str(recipe_id),
                                            deleted_recipe_ids,
                                            session,
                                            deleted_count,
                                        )
                                        continue

                                    # Check if recipe already exists
                                    existing = session.exec(
                                        select(Recipe).where(
                                            Recipe.external_id == str(recipe_id)
                                        )
                                    ).first()

                                    if existing:
                                        # Update existing recipe
                                        existing.name = recipe_name
                                        existing.data = json.dumps(recipe_data)
                                        existing.category = category
                                        existing.tags = json.dumps(recipe_tags)
                                        existing.imported_at = (
                                            datetime.utcnow().isoformat()
                                        )
                                        logger.debug(
                                            "Updating existing recipe: %s "
                                            "(ID: %s, imported_at: %s)",
                                            recipe_name,
                                            recipe_id,
                                            existing.imported_at,
                                        )
                                        session.add(existing)
                                    else:
                                        # Create new recipe
                                        new_recipe = Recipe(
                                            external_id=str(recipe_id),
                                            name=recipe_name,
                                            data=json.dumps(recipe_data),
                                            category=category,
                                            tags=json.dumps(recipe_tags),
                                            imported_at=datetime.utcnow().isoformat(),
                                        )
                                        logger.debug(
                                            "Creating new recipe: %s "
                                            "(ID: %s, imported_at: %s)",
                                            recipe_name,
                                            recipe_id,
                                            new_recipe.imported_at,
                                        )
                                        session.add(new_recipe)

                                    imported_count += 1

                                except Exception as e:
                                    errors.append(
                                        f"Failed to import recipe from "
                                        f"{recipe_file}: {str(e)}"
                                    )

                        except Exception as e:
                            error_msg = f"Failed to process {recipe_file}: {str(e)}"
                            errors.append(error_msg)

                    # Commit all recipes
                    commit_msg = json.dumps(
                        {
                            "status": "committing",
                            "message": "Saving to database...",
                        }
                    )
                    yield f"data: {commit_msg}\n\n"
                    session.commit()

                # Build message with counts
                message_parts = []
                if imported_count > 0:
                    message_parts.append(f"{imported_count} recipes imported")
                if deleted_count > 0:
                    message_parts.append(f"{deleted_count} recipes deleted")

                message = (
                    "Successfully " + " and ".join(message_parts)
                    if message_parts
                    else "No changes made"
                )

                # Send final success message
                complete_msg = json.dumps(
                    {
                        "status": "complete",
                        "success": True,
                        "imported": imported_count,
                        "deleted": deleted_count,
                        "errors": errors,
                        "message": message,
                    }
                )
                yield f"data: {complete_msg}\n\n"

            except requests.exceptions.Timeout:
                error_msg = json.dumps({"error": "WebDAV request timed out"})
                yield f"data: {error_msg}\n\n"
            except requests.exceptions.RequestException as e:
                error_msg = json.dumps({"error": f"WebDAV request failed: {str(e)}"})
                yield f"data: {error_msg}\n\n"
            except zipfile.BadZipFile:
                error_msg = json.dumps(
                    {"error": "Downloaded file is not a valid ZIP file"}
                )
                yield f"data: {error_msg}\n\n"
            except Exception as e:
                error_msg = json.dumps({"error": f"Import failed: {str(e)}"})
                yield f"data: {error_msg}\n\n"

    return StreamingResponse(generate_progress(), media_type="text/event-stream")
