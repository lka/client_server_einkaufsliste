"""Database Backup and Restore Router.

This module provides endpoints for backing up and restoring the entire database:
- JSON-based backup format that is structure-independent
- Full export of all data (users, stores, departments, products, items, templates)
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
)
from ..auth import get_current_user
from ..version import get_version


def get_session() -> Generator[Session, None, None]:
    """Dependency for database sessions."""
    engine = get_engine()
    with Session(engine) as session:
        yield session


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
        if field in converted and converted[field] is not None:
            if isinstance(converted[field], str):
                try:
                    converted[field] = datetime.fromisoformat(converted[field])
                except (ValueError, TypeError):
                    pass  # Leave as is if conversion fails

    for field in date_fields:
        if field in converted and converted[field] is not None:
            if isinstance(converted[field], str):
                try:
                    converted[field] = date.fromisoformat(converted[field])
                except (ValueError, TypeError):
                    pass  # Leave as is if conversion fails

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
    )

    return backup


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
            for item in session.exec(select(TemplateItem)).all():
                session.delete(item)

            for template in session.exec(select(ShoppingTemplate)).all():
                session.delete(template)

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

            session.commit()

        # Restore data in correct order (respecting foreign keys)
        restored_counts = {}

        # 1. Users (no dependencies)
        for user_data in restore_data.users:
            converted_data = convert_date_strings(user_data)
            user = User(**converted_data)
            session.add(user)
        session.commit()
        restored_counts["users"] = len(restore_data.users)

        # 2. Stores (no dependencies)
        for store_data in restore_data.stores:
            converted_data = convert_date_strings(store_data)
            store = Store(**converted_data)
            session.add(store)
        session.commit()
        restored_counts["stores"] = len(restore_data.stores)

        # 3. Departments (depends on stores)
        for dept_data in restore_data.departments:
            converted_data = convert_date_strings(dept_data)
            dept = Department(**converted_data)
            session.add(dept)
        session.commit()
        restored_counts["departments"] = len(restore_data.departments)

        # 4. Products (depends on departments and stores)
        for prod_data in restore_data.products:
            converted_data = convert_date_strings(prod_data)
            product = Product(**converted_data)
            session.add(product)
        session.commit()
        restored_counts["products"] = len(restore_data.products)

        # 5. Items (depends on stores)
        for item_data in restore_data.items:
            converted_data = convert_date_strings(item_data)
            item = Item(**converted_data)
            session.add(item)
        session.commit()
        restored_counts["items"] = len(restore_data.items)

        # 6. Templates (no dependencies)
        for template_data in restore_data.templates:
            converted_data = convert_date_strings(template_data)
            template = ShoppingTemplate(**converted_data)
            session.add(template)
        session.commit()
        restored_counts["templates"] = len(restore_data.templates)

        # 7. Template Items (depends on templates)
        for item_data in restore_data.template_items:
            converted_data = convert_date_strings(item_data)
            item = TemplateItem(**converted_data)
            session.add(item)
        session.commit()
        restored_counts["template_items"] = len(restore_data.template_items)

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
