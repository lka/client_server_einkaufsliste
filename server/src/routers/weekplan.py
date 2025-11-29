"""Weekly meal plan endpoints."""

import os
from typing import List
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import select
from pydantic import BaseModel

from ..models import WeekplanEntry, ShoppingTemplate, Store, Product, Item
from ..user_models import User
from ..db import get_session
from ..auth import get_current_user
from ..websocket_manager import manager

router = APIRouter(prefix="/api/weekplan", tags=["weekplan"])


class WeekplanEntryCreate(BaseModel):
    """Schema for creating a weekplan entry."""

    date: str  # ISO format: YYYY-MM-DD
    meal: str  # 'morning', 'lunch', 'dinner'
    text: str


class WeekplanEntryResponse(BaseModel):
    """Schema for weekplan entry response."""

    id: int
    date: str
    meal: str
    text: str


def _get_next_weekday(from_date: datetime, target_weekday: int) -> datetime:
    """Calculate the next occurrence of a target weekday.

    Args:
        from_date: Starting date
        target_weekday: Target day of week (0=Monday, 6=Sunday)

    Returns:
        Next occurrence of target weekday (including today if it matches)
    """
    days_ahead = target_weekday - from_date.weekday()
    if days_ahead < 0:  # Target day already passed this week
        days_ahead += 7
    return from_date + timedelta(days=days_ahead)


def _calculate_shopping_date(
    weekplan_date: str, template_item_name: str, first_store: Store, session, meal: str
) -> str:
    """Calculate the appropriate shopping date for a template item.

    Args:
        weekplan_date: Date from weekplan entry (YYYY-MM-DD)
        template_item_name: Name of the template item
        first_store: Store to use for product lookup
        session: Database session
        meal: Meal type ('morning', 'lunch', 'dinner')

    Returns:
        Shopping date in ISO format (YYYY-MM-DD)
    """
    # Get shopping day configuration from environment
    main_shopping_day = int(os.getenv("MAIN_SHOPPING_DAY", "2"))  # Default: Wednesday
    fresh_products_day = int(os.getenv("FRESH_PRODUCTS_DAY", "4"))  # Default: Friday

    # Parse weekplan date
    weekplan_datetime = datetime.fromisoformat(weekplan_date)

    # Calculate next MAIN_SHOPPING_DAY from today
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    next_main_shopping = _get_next_weekday(today, main_shopping_day)
    next_fresh_products = _get_next_weekday(today, fresh_products_day)

    # Important: Shopping date must be:
    # 1. NOT in the past (>= today)
    # 2. For dinner: NOT after the weekplan date (<= weekplan date)
    # 3. For morning/lunch: BEFORE the weekplan date (< weekplan date)

    # Meal-specific date comparison
    # For dinner, shopping on the same day is allowed
    # For breakfast and lunch, shopping must be the day before or earlier
    allow_same_day = meal == "dinner"

    # If the calculated shopping day is AFTER the weekplan date,
    # it's too late - we need to shop before the meal!
    if next_main_shopping.date() > weekplan_datetime.date():
        # The next regular shopping day is after the meal - too late!
        # Use today if it's valid for this meal type
        if allow_same_day and today.date() <= weekplan_datetime.date():
            next_main_shopping = today
        elif not allow_same_day and today.date() < weekplan_datetime.date():
            next_main_shopping = today
        else:
            # Even today doesn't work - this shouldn't happen
            # as we filter past dates earlier, but just in case
            next_main_shopping = today
    elif not allow_same_day and next_main_shopping.date() == weekplan_datetime.date():
        # For morning/lunch: if shopping day equals meal day, use today instead
        # (only if today is before the meal)
        if today.date() < weekplan_datetime.date():
            next_main_shopping = today

    # For fresh products, adjust the date to be valid
    if next_fresh_products.date() < today.date():
        # The fresh products day is in the past - move to next week
        next_fresh_products = next_fresh_products + timedelta(days=7)

    # Now check if fresh products day is after the weekplan date
    if next_fresh_products.date() > weekplan_datetime.date():
        # The fresh products day is after the meal - too late!
        # Use the main shopping day instead (which we already adjusted above)
        next_fresh_products = next_main_shopping
    elif not allow_same_day and next_fresh_products.date() == weekplan_datetime.date():
        # For morning/lunch: if fresh products day equals meal day, use today instead
        # (only if today is before the meal)
        if today.date() < weekplan_datetime.date():
            next_fresh_products = today
        else:
            # Today is on or after the meal day - use main shopping day
            next_fresh_products = next_main_shopping

    # Default to main shopping day
    shopping_date = next_main_shopping.date().isoformat()

    # Check if this is a fresh product
    # Find matching product in the first store
    products = session.exec(
        select(Product).where(
            Product.store_id == first_store.id, Product.name == template_item_name
        )
    ).all()

    is_fresh = False
    for product in products:
        if product.fresh:
            is_fresh = True
            break

    # Fresh products logic:
    # Use fresh products day when weekplan_datetime >= next_fresh_products
    # EXCEPTION: For dinner on main shopping day, use main shopping day instead
    #            (don't buy fresh products on Friday for Wednesday dinner)
    if is_fresh and weekplan_datetime.date() >= next_fresh_products.date():
        # Check for the special case: dinner on main shopping day
        # if meal == "dinner" and weekplan_datetime.date() == next_main_shopping.date():
        #     # Dinner on main shopping day → use main shopping day, not fresh day
        #     pass  # shopping_date is already set to main shopping day
        # else:
        # All other cases: use fresh products day
        shopping_date = next_fresh_products.date().isoformat()

    return shopping_date


def _add_template_items_to_shopping_list(
    session, template_name: str, weekplan_date: str, meal: str
) -> List[Item]:
    """Add template items to shopping list when weekplan entry matches template name.

    Args:
        session: Database session
        template_name: Name of the template to check
        weekplan_date: Date from weekplan entry (YYYY-MM-DD)
        meal: Meal type ('morning', 'lunch', 'dinner')

    Returns:
        List of items that were added or modified
    """
    modified_items = []

    # Check if weekplan date is in the past
    weekplan_datetime = datetime.fromisoformat(weekplan_date)
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    if weekplan_datetime.date() < today.date():
        return modified_items  # Don't add items for past dates

    # Check if template exists with exact match
    template = session.exec(
        select(ShoppingTemplate).where(ShoppingTemplate.name == template_name)
    ).first()

    if not template:
        return modified_items  # No matching template, nothing to do

    # Get first store by sort_order
    first_store = session.exec(
        select(Store).order_by(Store.sort_order, Store.id)
    ).first()

    if not first_store:
        return modified_items  # No store available

    # Add each template item to shopping list
    for template_item in template.template_items:
        # Calculate shopping date using helper function
        shopping_date = _calculate_shopping_date(
            weekplan_date, template_item.name, first_store, session, meal
        )

        # Add items directly with merge logic (similar to create_item endpoint)
        from ..routers.items import _find_existing_item, _find_matching_product
        from ..utils import merge_quantities
        import uuid

        # Find existing item with same name, date, and store
        existing_item = _find_existing_item(
            session, template_item.name, shopping_date, first_store.id
        )

        if existing_item:
            # Merge quantities
            merged_menge = merge_quantities(existing_item.menge, template_item.menge)
            if merged_menge is None or merged_menge.strip() == "":
                session.delete(existing_item)
                # Don't add deleted items to modified_items
            else:
                existing_item.menge = merged_menge
                session.add(existing_item)
                modified_items.append(existing_item)
        else:
            # Create new item
            new_item = Item(
                id=str(uuid.uuid4()),
                name=template_item.name,
                menge=template_item.menge,
                store_id=first_store.id,
                shopping_date=shopping_date,
                user_id=None,
            )

            # Find matching product
            product_id = _find_matching_product(session, new_item)
            if product_id:
                new_item.product_id = product_id

            session.add(new_item)
            modified_items.append(new_item)

        session.commit()

    return modified_items


def _remove_template_items_from_shopping_list(
    session, template_name: str, weekplan_date: str, meal: str
) -> List[Item]:
    """Remove template items from shopping list when weekplan entry is deleted.

    This reverses the action of _add_template_items_to_shopping_list by
    subtracting the template quantities from the shopping list.

    Args:
        session: Database session
        template_name: Name of the template to check
        weekplan_date: Date from weekplan entry (YYYY-MM-DD)
        meal: Meal type ('morning', 'lunch', 'dinner')

    Returns:
        List of items that were modified or deleted
    """
    modified_items = []

    # Check if weekplan date is in the past
    weekplan_datetime = datetime.fromisoformat(weekplan_date)
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    if weekplan_datetime.date() < today.date():
        return modified_items  # Don't remove items for past dates (they weren't added)

    # Check if template exists with exact match
    template = session.exec(
        select(ShoppingTemplate).where(ShoppingTemplate.name == template_name)
    ).first()

    if not template:
        return modified_items  # No matching template, nothing to do

    # Get first store by sort_order
    first_store = session.exec(
        select(Store).order_by(Store.sort_order, Store.id)
    ).first()

    if not first_store:
        return modified_items  # No store available

    # Remove each template item from shopping list
    for template_item in template.template_items:
        # Calculate shopping date using helper function (same logic as add)
        shopping_date = _calculate_shopping_date(
            weekplan_date, template_item.name, first_store, session, meal
        )

        # Subtract quantities using merge logic
        from ..routers.items import _find_existing_item
        from ..utils import merge_quantities

        # Find existing item with same name, date, and store
        existing_item = _find_existing_item(
            session, template_item.name, shopping_date, first_store.id
        )

        if existing_item and template_item.menge:
            # Create negative quantity for subtraction
            negative_menge = template_item.menge
            if negative_menge:
                # Parse and negate the quantity
                from ..utils import parse_quantity

                parsed_num, unit = parse_quantity(negative_menge)
                if parsed_num is not None:
                    # Create negative version
                    if parsed_num == int(parsed_num):
                        negative_menge = f"-{int(parsed_num)}"
                    else:
                        negative_menge = f"-{parsed_num}"
                    if unit:
                        negative_menge = f"{negative_menge} {unit}"

                    # Merge with negative quantity (subtraction)
                    merged_menge = merge_quantities(existing_item.menge, negative_menge)

                    if merged_menge is None or merged_menge.strip() == "":
                        # Quantity reduced to zero or below, delete item
                        session.delete(existing_item)
                        # Don't add deleted items to modified_items
                    else:
                        # Update with reduced quantity
                        existing_item.menge = merged_menge
                        session.add(existing_item)
                        modified_items.append(existing_item)

                    session.commit()

    return modified_items


@router.get("/entries", response_model=List[WeekplanEntryResponse])
def get_weekplan_entries(
    week_start: str,  # ISO format: YYYY-MM-DD (Monday of the week)
    current_user: str = Depends(get_current_user),
):
    """Get all weekplan entries for a specific week (shared across all users).

    Args:
        week_start: Monday of the week in ISO format (YYYY-MM-DD)
        current_user: Current authenticated username from JWT (for authentication only)

    Returns:
        List of weekplan entries for the week
    """
    with get_session() as session:
        # Verify user is authenticated
        user = session.exec(select(User).where(User.username == current_user)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Calculate week dates (7 days from week_start)
        from datetime import datetime, timedelta

        start_date = datetime.fromisoformat(week_start).date()
        end_date = start_date + timedelta(days=6)

        # Query entries for the week (shared across all users)
        statement = select(WeekplanEntry).where(
            WeekplanEntry.date >= week_start, WeekplanEntry.date <= end_date.isoformat()
        )
        entries = session.exec(statement).all()

        return [
            WeekplanEntryResponse(
                id=entry.id, date=entry.date, meal=entry.meal, text=entry.text
            )
            for entry in entries
        ]


@router.post("/entries", response_model=WeekplanEntryResponse)
async def create_weekplan_entry(
    entry: WeekplanEntryCreate, current_user: str = Depends(get_current_user)
):
    """Create a new weekplan entry (shared across all users).

    If the entry text matches a shopping template name exactly, the template's
    items are automatically added to the shopping list with intelligent quantity
    merging.

    Args:
        entry: Entry data
        current_user: Current authenticated username from JWT (for authentication only)

    Returns:
        Created weekplan entry
    """
    with get_session() as session:
        # Verify user is authenticated
        user = session.exec(select(User).where(User.username == current_user)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Create entry (shared, no user_id)
        db_entry = WeekplanEntry(date=entry.date, meal=entry.meal, text=entry.text)
        session.add(db_entry)
        session.commit()
        session.refresh(db_entry)

        # Check if entry text matches a shopping template and add items to shopping list
        modified_items = _add_template_items_to_shopping_list(
            session, entry.text, entry.date, entry.meal
        )

        # Broadcast shopping list changes to all connected clients
        for item in modified_items:
            await manager.broadcast(
                {
                    "type": "item:added",
                    "data": {
                        "id": item.id,
                        "name": item.name,
                        "menge": item.menge,
                        "store_id": item.store_id,
                        "product_id": item.product_id,
                        "shopping_date": item.shopping_date,
                        "user_id": item.user_id,
                    },
                }
            )

        return WeekplanEntryResponse(
            id=db_entry.id, date=db_entry.date, meal=db_entry.meal, text=db_entry.text
        )


@router.delete("/entries/{entry_id}")
async def delete_weekplan_entry(
    entry_id: int, current_user: str = Depends(get_current_user)
):
    """Delete a weekplan entry (shared across all users).

    If the entry text matches a shopping template name exactly, the template's
    items are automatically removed from the shopping list (quantities are
    subtracted using intelligent quantity merging).

    Args:
        entry_id: Entry ID
        current_user: Current authenticated username from JWT (for authentication only)

    Returns:
        Success message
    """
    with get_session() as session:
        # Verify user is authenticated
        user = session.exec(select(User).where(User.username == current_user)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Get entry
        entry = session.get(WeekplanEntry, entry_id)
        if not entry:
            raise HTTPException(status_code=404, detail="Entry not found")

        # Check if entry text matches a shopping template and remove items
        # from shopping list
        # Do this BEFORE deleting the entry so we still have access to entry.text
        # and entry.date
        modified_items = _remove_template_items_from_shopping_list(
            session, entry.text, entry.date, entry.meal
        )

        # Broadcast shopping list changes to all connected clients
        for item in modified_items:
            await manager.broadcast(
                {
                    "type": "item:updated",
                    "data": {
                        "id": item.id,
                        "name": item.name,
                        "menge": item.menge,
                        "store_id": item.store_id,
                        "product_id": item.product_id,
                        "shopping_date": item.shopping_date,
                        "user_id": item.user_id,
                    },
                }
            )

        # Delete entry (no ownership check - shared across all users)
        session.delete(entry)
        session.commit()

        return {"message": "Entry deleted successfully"}
