"""WebDAV settings management endpoints."""

from typing import List
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import select

from ..models import WebDAVSettings
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
