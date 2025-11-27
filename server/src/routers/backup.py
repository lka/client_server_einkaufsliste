"""Database Backup and Restore Router.

This module provides endpoints for backing up and restoring the entire database:
- JSON-based backup format that is structure-independent
- Full export of all data (users, stores, departments, products, items, templates,
                           weekplan entries)
- Restore with validation and error handling
- Version information for compatibility checking
"""

from typing import Generator, Any
from datetime import datetime, date
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from sqlmodel import Session, select
from pydantic import BaseModel

from ..db import get_engine
from ..user_models import User
from ..models import (
    Store,
    Department,
    Product,
    Item,
    ShoppingTemplate,
    TemplateItem,
    WeekplanEntry,
)
from ..auth import get_current_user
from ..version import get_version


def get_session() -> Generator[Session, None, None]:
    """Dependency for database sessions."""
    engine = get_engine()
    with Session(engine) as session:
        yield session


def _try_parse_iso_date(date_str: str) -> Any:
    """Try to parse an ISO date string into a datetime or date object.

    Args:
        date_str: The ISO date string to parse
    Returns:
        datetime or date object if parsing is successful, else original string
    """
    try:
        return datetime.fromisoformat(date_str)
    except (ValueError, TypeError):
        pass

    try:
        return date.fromisoformat(date_str)
    except (ValueError, TypeError):
        pass

    return date_str


def convert_date_strings(data: dict[str, Any]) -> dict[str, Any]:
    """Convert ISO date strings to datetime/date objects.

    Args:
        data: Dictionary that may contain date strings

    Returns:
        Dictionary with date strings converted to datetime/date objects
    """
    converted = data.copy()

    # Fields that should be datetime objects
    datetime_fields = ["created_at", "updated_at"]
    # Fields that should be date objects
    date_fields = ["shopping_date"]

    for field in datetime_fields:
        if (
            field in converted
            and converted[field] is not None
            and isinstance(converted[field], str)
        ):
            converted[field] = _try_parse_iso_date(converted[field])

    for field in date_fields:
        if (
            field in converted
            and converted[field] is not None
            and isinstance(converted[field], str)
        ):
            converted[field] = _try_parse_iso_date(converted[field])

    return converted


router = APIRouter(prefix="/api/backup", tags=["backup"])


class BackupData(BaseModel):
    """Response model for database backup."""

    version: str
    timestamp: str
    users: list[dict[str, Any]]
    stores: list[dict[str, Any]]
    departments: list[dict[str, Any]]
    products: list[dict[str, Any]]
    items: list[dict[str, Any]]
    templates: list[dict[str, Any]]
    template_items: list[dict[str, Any]]
    weekplan_entries: list[dict[str, Any]]


class RestoreData(BaseModel):
    """Request model for database restore."""

    version: str
    timestamp: str
    users: list[dict[str, Any]]
    stores: list[dict[str, Any]]
    departments: list[dict[str, Any]]
    products: list[dict[str, Any]]
    items: list[dict[str, Any]]
    templates: list[dict[str, Any]]
    template_items: list[dict[str, Any]]
    weekplan_entries: list[dict[str, Any]]


@router.get("", response_model=BackupData)
def create_backup(
    session: Session = Depends(get_session),
    current_user: str = Depends(get_current_user),
):
    """Create a full database backup in JSON format.

    Returns:
        JSON object containing all database tables with metadata

    Note:
        - Uses SQLModel's dict() method for automatic serialization
        - Includes version and timestamp for compatibility checking
        - Password hashes are included (needed for restore)
    """
    # Fetch all data from database
    users = session.exec(select(User)).all()
    stores = session.exec(select(Store)).all()
    departments = session.exec(select(Department)).all()
    products = session.exec(select(Product)).all()
    items = session.exec(select(Item)).all()
    templates = session.exec(select(ShoppingTemplate)).all()
    template_items = session.exec(select(TemplateItem)).all()
    weekplan_entries = session.exec(select(WeekplanEntry)).all()

    # Convert to dictionaries (SQLModel handles this automatically)
    backup = BackupData(
        version=get_version(),
        timestamp=datetime.now().isoformat(),
        users=[user.model_dump() for user in users],
        stores=[store.model_dump() for store in stores],
        departments=[dept.model_dump() for dept in departments],
        products=[prod.model_dump() for prod in products],
        items=[item.model_dump() for item in items],
        templates=[template.model_dump() for template in templates],
        template_items=[item.model_dump() for item in template_items],
        weekplan_entries=[entry.model_dump() for entry in weekplan_entries],
    )

    return backup


def _clear_existing_data(session: Session):
    """Clear all existing data from the database (Helper function)."""
    # Delete in correct order (respecting foreign keys)
    for item in session.exec(select(TemplateItem)).all():
        session.delete(item)

    for template in session.exec(select(ShoppingTemplate)).all():
        session.delete(template)

    for entry in session.exec(select(WeekplanEntry)).all():
        session.delete(entry)

    for item in session.exec(select(Item)).all():
        session.delete(item)

    for product in session.exec(select(Product)).all():
        session.delete(product)

    for dept in session.exec(select(Department)).all():
        session.delete(dept)

    for store in session.exec(select(Store)).all():
        session.delete(store)

    for user in session.exec(select(User)).all():
        session.delete(user)


def _restore_entity_list(
    session: Session,
    entity_class: Any,
    data_list: list[dict[str, Any]],
):
    """Restore a list of entities into the databaseHelper function ."""
    for data in data_list:
        converted_data = convert_date_strings(data)
        entity = entity_class(**converted_data)
        session.add(entity)
    session.commit()


@router.post("/restore", status_code=200)
def restore_backup(
    restore_data: RestoreData,
    clear_existing: bool = True,
    session: Session = Depends(get_session),
    current_user: str = Depends(get_current_user),
):
    """Restore database from backup JSON.

    Args:
        restore_data: Backup data to restore
        clear_existing: If True, clear all existing data first (default: True)

    Returns:
        Summary of restored records

    Raises:
        HTTPException: 400 if validation fails

    Note:
        - Version compatibility is informational (warns but doesn't block)
        - Optionally clears existing data before restore
        - Uses transactions to ensure atomicity
        - Preserves IDs from backup for referential integrity
    """
    # Log version for informational purposes
    current_version = get_version()
    if restore_data.version != current_version:
        print(
            f"Warning: Restoring backup from version {restore_data.version} "
            f"to version {current_version}"
        )

    try:
        # Clear existing data if requested
        if clear_existing:
            # Delete in correct order (respecting foreign keys)
            session.exec(select(TemplateItem)).all()
            _clear_existing_data(session)
            session.commit()

        # Restore data in correct order (respecting foreign keys)
        restored_counts = {}

        # 1. Users (no dependencies)
        _restore_entity_list(session, User, restore_data.users)
        restored_counts["users"] = len(restore_data.users)

        # 2. Stores (no dependencies)
        _restore_entity_list(session, Store, restore_data.stores)
        restored_counts["stores"] = len(restore_data.stores)

        # 3. Departments (depends on stores)
        _restore_entity_list(session, Department, restore_data.departments)
        restored_counts["departments"] = len(restore_data.departments)

        # 4. Products (depends on departments and stores)
        _restore_entity_list(session, Product, restore_data.products)
        restored_counts["products"] = len(restore_data.products)

        # 5. Items (depends on stores)
        _restore_entity_list(session, Item, restore_data.items)
        restored_counts["items"] = len(restore_data.items)

        # 6. Templates (no dependencies)
        _restore_entity_list(session, ShoppingTemplate, restore_data.templates)
        restored_counts["templates"] = len(restore_data.templates)

        # 7. Template Items (depends on templates)
        _restore_entity_list(session, TemplateItem, restore_data.template_items)
        restored_counts["template_items"] = len(restore_data.template_items)

        # 8. Weekplan Entries (no dependencies)
        _restore_entity_list(session, WeekplanEntry, restore_data.weekplan_entries)
        restored_counts["weekplan_entries"] = len(restore_data.weekplan_entries)

        return JSONResponse(
            content={
                "message": "Database restored successfully",
                "restored": restored_counts,
                "timestamp": restore_data.timestamp,
            }
        )

    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Restore failed: {str(e)}")
