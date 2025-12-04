"""WebDAV settings management endpoints."""

import json
import zipfile
from io import BytesIO
from typing import List
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import select
import requests
from requests.auth import HTTPBasicAuth

from ..models import WebDAVSettings, Recipe
from ..db import get_session
from ..auth import get_current_user
from ..schemas import WebDAVSettingsCreate, WebDAVSettingsUpdate

router = APIRouter(prefix="/api/webdav", tags=["webdav"])


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


@router.post("/{settings_id}/import", status_code=200)
def import_recipes_from_webdav(
    settings_id: int, current_user: str = Depends(get_current_user)
):
    """Import recipes from WebDAV server using specified settings.

    Args:
        settings_id: WebDAV settings ID to use for import
        current_user: Current authenticated username from JWT

    Returns:
        dict: Import statistics (imported count, errors, etc.)

    Raises:
        HTTPException: If settings not found or import fails
    """
    with get_session() as session:
        settings = session.get(WebDAVSettings, settings_id)
        if not settings:
            raise HTTPException(status_code=404, detail="WebDAV settings not found")

        if not settings.enabled:
            raise HTTPException(status_code=400, detail="WebDAV settings are disabled")

        try:
            # Download ZIP file from WebDAV
            webdav_url = f"{settings.url.rstrip('/')}/{settings.filename}"
            response = requests.get(
                webdav_url,
                auth=HTTPBasicAuth(settings.username, settings.password),
                timeout=30,
            )

            if response.status_code == 401:
                raise HTTPException(
                    status_code=401, detail="WebDAV authentication failed"
                )

            if response.status_code != 200:
                raise HTTPException(
                    status_code=500,
                    detail=(
                        "Failed to download file from WebDAV: "
                        f"{response.status_code}"
                    ),
                )

            # Extract ZIP file
            zip_data = BytesIO(response.content)
            imported_count = 0
            deleted_count = 0
            errors = []

            with zipfile.ZipFile(zip_data, "r") as zip_file:
                # Get list of all recipe files
                recipe_files = [
                    f for f in zip_file.namelist() if f.startswith("recipes_")
                ]

                # Read deleted recipes from status.json
                deleted_recipe_ids = set()
                if "status.json" in zip_file.namelist():
                    try:
                        status_content = zip_file.read("status.json")
                        status_data = json.loads(status_content)
                        deleted_recipes = status_data.get("deletedRecipes", [])
                        deleted_recipe_ids = set(deleted_recipes)
                    except Exception as e:
                        errors.append(f"Failed to read status.json: {str(e)}")

                # Read categories and tags for enrichment (future use)
                if "categories.json" in zip_file.namelist():
                    try:
                        categories_content = zip_file.read("categories.json")
                        json.loads(categories_content)  # noqa: F841
                    except Exception as e:
                        errors.append(f"Failed to read categories: {str(e)}")

                if "tags.json" in zip_file.namelist():
                    try:
                        tags_content = zip_file.read("tags.json")
                        json.loads(tags_content)  # noqa: F841
                    except Exception as e:
                        errors.append(f"Failed to read tags: {str(e)}")

                # Import recipes from all recipe files
                for recipe_file in recipe_files:
                    try:
                        content = zip_file.read(recipe_file)
                        recipes_list = json.loads(content)

                        # Handle both single recipe and list of recipes
                        if isinstance(recipes_list, dict):
                            recipes_list = [recipes_list]

                        for recipe_data in recipes_list:
                            try:
                                # Extract recipe information
                                # Use uuid or id as external identifier
                                recipe_id = recipe_data.get(
                                    "uuid", recipe_data.get("id", "")
                                )

                                # Skip recipes that are in deletedRecipes
                                if str(recipe_id) in deleted_recipe_ids:
                                    # Check if recipe exists in database and delete it
                                    existing = session.exec(
                                        select(Recipe).where(
                                            Recipe.external_id == str(recipe_id)
                                        )
                                    ).first()
                                    if existing:
                                        session.delete(existing)
                                        deleted_count += 1
                                    continue

                                # Use title or name as recipe name
                                recipe_name = recipe_data.get(
                                    "title", recipe_data.get("name", "Unnamed Recipe")
                                )
                                # Extract category (can be string or array)
                                category_data = recipe_data.get(
                                    "categories", recipe_data.get("category", "")
                                )
                                if (
                                    isinstance(category_data, list)
                                    and len(category_data) > 0
                                ):
                                    category = (
                                        category_data[0]
                                        if isinstance(category_data[0], str)
                                        else ""
                                    )
                                else:
                                    category = (
                                        category_data
                                        if isinstance(category_data, str)
                                        else ""
                                    )
                                # Extract tags
                                recipe_tags = recipe_data.get("tags", [])

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
                                    existing.imported_at = datetime.utcnow().isoformat()
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
                                    session.add(new_recipe)

                                imported_count += 1

                            except Exception as e:
                                errors.append(
                                    f"Failed to import recipe from "
                                    f"{recipe_file}: {str(e)}"
                                )

                    except Exception as e:
                        errors.append(f"Failed to process {recipe_file}: {str(e)}")

                # Commit all recipes
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

            return {
                "success": True,
                "imported": imported_count,
                "deleted": deleted_count,
                "errors": errors,
                "message": message,
            }

        except requests.exceptions.Timeout:
            raise HTTPException(status_code=504, detail="WebDAV request timed out")
        except requests.exceptions.RequestException as e:
            raise HTTPException(
                status_code=500, detail=f"WebDAV request failed: {str(e)}"
            )
        except zipfile.BadZipFile:
            raise HTTPException(
                status_code=400, detail="Downloaded file is not a valid ZIP file"
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")
