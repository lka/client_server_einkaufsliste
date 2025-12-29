"""Weekly meal plan endpoints."""

import os
import json
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import select
from pydantic import BaseModel

from ..models import (
    WeekplanEntry,
    ShoppingTemplate,
    Store,
    Product,
    Item,
    Recipe,
    Unit,
)
from ..user_models import User
from ..db import get_session
from ..auth import get_current_user
from ..websocket_manager import manager

router = APIRouter(prefix="/api/weekplan", tags=["weekplan"])


class DeltaItem(BaseModel):
    """Schema for a delta item."""

    name: str
    menge: Optional[str] = None


class WeekplanDeltas(BaseModel):
    """Schema for weekplan entry deltas."""

    removed_items: List[str] = []
    added_items: List[DeltaItem] = []
    person_count: Optional[int] = None


class WeekplanEntryCreate(BaseModel):
    """Schema for creating a weekplan entry."""

    date: str  # ISO format: YYYY-MM-DD
    meal: str  # 'morning', 'lunch', 'dinner'
    text: str
    entry_type: Optional[str] = "text"  # 'text', 'template', or 'recipe'
    recipe_id: Optional[int] = None
    template_id: Optional[int] = None
    deltas: Optional[WeekplanDeltas] = None


class WeekplanEntryResponse(BaseModel):
    """Schema for weekplan entry response."""

    id: int
    date: str
    meal: str
    text: str
    entry_type: Optional[str] = "text"  # 'text', 'template', or 'recipe'
    recipe_id: Optional[int] = None
    template_id: Optional[int] = None
    deltas: Optional[WeekplanDeltas] = None


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


def _adjust_quantity_by_person_count(
    original_menge: Optional[str], person_count: int, original_person_count: int = 2
) -> Optional[str]:
    """Adjust quantity based on person count.

    Supports fractions (½, ¼, ¾, etc.) and mixed numbers (1½, 2¼, etc.).

    Args:
        original_menge: Original quantity string
            (e.g., "2 kg", "500 g", "½ TL", "1½ kg")
        person_count: Target person count
        original_person_count: Original person count the template was designed for

    Returns:
        Adjusted quantity string or None if input is None

    Examples:
        - "½ TL" with person_count=4, original_person_count=2 -> "1 TL"
        - "1½ kg" with person_count=2, original_person_count=4
            -> "750 g" (if under 1 kg) or "0,75 kg"
        - "2 kg" with person_count=3, original_person_count=2 -> "3 kg"
    """
    if not original_menge:
        return original_menge

    from ..utils import parse_quantity

    # Parse the quantity using the enhanced parser (supports fractions)
    value, unit = parse_quantity(original_menge)

    if value is None:
        return original_menge  # Can't parse, return original

    # Prevent division by zero
    if not original_person_count or original_person_count == 0:
        return original_menge  # Can't calculate without valid original count

    # Calculate factor and apply
    factor = person_count / original_person_count
    adjusted_value = value * factor

    # Format the result
    if adjusted_value % 1 == 0:
        formatted_value = str(int(adjusted_value))
    else:
        formatted_value = f"{adjusted_value:.2f}".rstrip("0").rstrip(".")

    return f"{formatted_value} {unit}" if unit else formatted_value


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
    session,
    template_name: str,
    weekplan_date: str,
    meal: str,
    deltas: Optional[WeekplanDeltas] = None,
) -> List[Item]:
    """Add template items to shopping list when weekplan entry matches template name.

    Args:
        session: Database session
        template_name: Name of the template to check
        weekplan_date: Date from weekplan entry (YYYY-MM-DD)
        meal: Meal type ('morning', 'lunch', 'dinner')
        deltas: Optional deltas to apply (removed items, added items)

    Returns:
        List of items that were added or modified
    """
    import uuid
    from ..routers.items import _find_existing_item, _find_matching_product
    from ..utils import merge_quantities

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

    # Create set of removed items for fast lookup
    removed_items = set(deltas.removed_items) if deltas else set()

    # Get person_count from deltas if available
    person_count = deltas.person_count if deltas else None

    # Add each template item to shopping list (unless removed in deltas)
    for template_item in template.template_items:
        # Skip items that are marked as removed in deltas
        if template_item.name in removed_items:
            continue
        # Calculate shopping date using helper function
        shopping_date = _calculate_shopping_date(
            weekplan_date, template_item.name, first_store, session, meal
        )

        # Adjust quantity based on person_count if provided
        item_menge = template_item.menge
        if person_count is not None:
            item_menge = _adjust_quantity_by_person_count(
                template_item.menge, person_count, template.person_count
            )

        # Add items directly with merge logic (similar to create_item endpoint)
        # Find existing item with same name, date, and store
        existing_item = _find_existing_item(
            session, template_item.name, shopping_date, first_store.id
        )

        if existing_item:
            # Merge quantities
            merged_menge = merge_quantities(existing_item.menge, item_menge)
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
                menge=item_menge,
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

    # Add items from deltas.added_items
    if deltas and deltas.added_items:
        for delta_item in deltas.added_items:
            # Calculate shopping date
            shopping_date = _calculate_shopping_date(
                weekplan_date, delta_item.name, first_store, session, meal
            )

            # Find existing item
            existing_item = _find_existing_item(
                session, delta_item.name, shopping_date, first_store.id
            )

            if existing_item:
                # Merge quantities
                merged_menge = merge_quantities(existing_item.menge, delta_item.menge)
                if merged_menge is None or merged_menge.strip() == "":
                    session.delete(existing_item)
                else:
                    existing_item.menge = merged_menge
                    session.add(existing_item)
                    modified_items.append(existing_item)
            else:
                # Create new item
                new_item = Item(
                    id=str(uuid.uuid4()),
                    name=delta_item.name,
                    menge=delta_item.menge,
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


def _get_known_units(session) -> list[str]:
    """Return list of known measurement units for ingredient parsing from database.

    Args:
        session: Database session

    Returns:
        List of unit names ordered by sort_order
    """
    units = session.exec(select(Unit).order_by(Unit.sort_order)).all()
    return [unit.name for unit in units]


@router.get("/known-units", response_model=List[str])
def get_known_units(current_user: str = Depends(get_current_user)):
    """Get list of known measurement units for ingredient parsing.

    Args:
        current_user: Current authenticated username from JWT (for authentication only)

    Returns:
        List of known measurement units
    """
    with get_session() as session:
        # Verify user is authenticated
        user = session.exec(select(User).where(User.username == current_user)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return _get_known_units(session)


def _parse_recipe_data(recipe: Recipe) -> tuple[str, int, list[str]]:
    """Parse recipe data and return ingredients text, original quantity, and lines.

    Args:
        recipe: Recipe instance

    Returns:
        Tuple of (ingredients_text, original_quantity, ingredient_lines)
    """
    import json
    import re

    recipe_data = json.loads(recipe.data)
    ingredients_text = recipe_data.get("ingredients", "")

    # Ensure original_quantity is an integer (fallback to 1 person)
    quantity = recipe_data.get("quantity", 1)
    try:
        original_quantity = int(quantity) if quantity else 1
    except (ValueError, TypeError):
        original_quantity = 1

    # Filter out empty lines and lines containing HTML tags
    ingredient_lines = [
        line.strip()
        for line in ingredients_text.split("\n")
        if line.strip() and not re.search(r"<[^>]+>", line.strip())
    ]

    return ingredients_text, original_quantity, ingredient_lines


def _create_ingredient_pattern(session):
    """Create regex pattern for parsing ingredients with known units.

    Supports regular numbers, unicode fractions (½, ¼, ¾, etc.),
    mixed numbers (1½, 2¼, etc.), and text-based fractions (1/2, 2 1/2, etc.).

    Args:
        session: Database session

    Returns:
        Compiled regex pattern

    Examples:
        - "500 g Mehl" -> ("500 g", "Mehl")
        - "½ TL Salz" -> ("½ TL", "Salz")
        - "1½ kg Zucker" -> ("1½ kg", "Zucker")
        - "2¼ l Milch" -> ("2¼ l", "Milch")
        - "1/2 TL Salz" -> ("1/2 TL", "Salz")
        - "2 1/2 kg Zucker" -> ("2 1/2 kg", "Zucker")
    """
    import re

    known_units = _get_known_units(session)
    units_pattern = "|".join(known_units)

    # Pattern explanation:
    # Matches one of the following quantity formats:
    #   1. Unicode fractions: \d*[½¼¾⅓⅔⅕⅖⅗⅘⅙⅚⅐⅑⅛⅜⅝⅞] (e.g., "½", "1½", "2¼")
    #   2. Text-based fractions: \d+\s*\d+/\d+ or \d+/\d+ (e.g., "1/2", "2 1/2", "3/4")
    #   3. Regular numbers: [\d\.,]+ (e.g., "500", "2.5", "1,5")
    # Followed by optional unit preceded by optional whitespace
    return re.compile(
        rf"^((?:\d*[½¼¾⅓⅔⅕⅖⅗⅘⅙⅚⅐⅑⅛⅜⅝⅞]|\d+\s*\d+/\d+|\d+/\d+|[\d\.,]+)"
        rf"(?:\s*(?:{units_pattern}))?)\s+(.+)$"
    )


def _normalize_quantity(quantity_str: str | None) -> str | None:
    """Normalize quantity string by converting text fractions to decimals.

    Args:
        quantity_str: Quantity string like "1/2 kg", "2 1/2 TL", "500 g"

    Returns:
        Normalized quantity string with decimal fractions like "0,5 kg", "2,5 TL"

    Examples:
        "1/2 kg" -> "0,5 kg"
        "2 1/2 TL" -> "2,5 TL"
        "3/4 l" -> "0,75 l"
        "500 g" -> "500 g" (unchanged)
    """
    if not quantity_str:
        return quantity_str

    from ..utils import parse_quantity

    # Parse the quantity
    number, unit = parse_quantity(quantity_str)

    if number is None:
        # Can't parse, return original
        return quantity_str

    # Format the number
    if number == int(number):
        formatted_number = str(int(number))
    else:
        # Use comma as decimal separator
        formatted_number = str(number).replace(".", ",")

    # Combine with unit
    if unit:
        return f"{formatted_number} {unit}"
    return formatted_number


def _parse_ingredient_line(line: str, pattern) -> tuple[str | None, str]:
    """Parse a single ingredient line into quantity and name.

    Removes content within parentheses from the ingredient name.

    Args:
        line: Ingredient line to parse
        pattern: Regex pattern for parsing

    Returns:
        Tuple of (quantity_str, name)

    Examples:
        "500 g Mehl (Type 405)" -> ("500 g", "Mehl")
        "2 EL Öl (z.B. Olivenöl)" -> ("2 EL", "Öl")
        "Salz (nach Geschmack)" -> (None, "Salz")
        "1/2 kg Mehl" -> ("0,5 kg", "Mehl")
        "2 1/2 TL Zucker" -> ("2,5 TL", "Zucker")
    """
    import re

    match = pattern.match(line)
    if match:
        quantity_str = match.group(1).strip()
        name = match.group(2).strip()
        # Normalize text-based fractions to decimal format
        quantity_str = _normalize_quantity(quantity_str)
    else:
        quantity_str = None
        name = line.strip()

    # Remove content within parentheses (including the parentheses)
    # This handles cases like "Mehl (Type 405)" -> "Mehl"
    name = re.sub(r"\s*\([^)]*\)", "", name).strip()

    return quantity_str, name


def _create_removed_items_set(removed_items: List[str], pattern) -> set:
    """Create set of removed items for fast lookup (Helper function).

    Parse each removed item to remove parentheses, matching the behavior
    of how ingredients are parsed from recipes

    Args:
        removed_items (List[str]): List of removed item names
        pattern (_type_): Regex pattern for parsing ingredients

    Returns:
        set: Set of parsed item names (without parentheses)
    """
    return {
        _parse_ingredient_line(item_name, pattern)[1] for item_name in removed_items
    }


def _find_item_by_match_strategy(
    session, name: str, shopping_date: str, store_id: int
) -> Item | None:
    """Find existing item using intelligent matching strategy.

    Uses exact match if name exists in product list, otherwise fuzzy matching.

    Args:
        session: Database session
        name: Item name to search for
        shopping_date: Shopping date
        store_id: Store ID

    Returns:
        Existing item if found, None otherwise
    """
    from ..routers.items import (
        _find_existing_item,
        _find_existing_item_exact,
        _find_exact_product_match,
    )

    if _find_exact_product_match(session, name, store_id):
        return _find_existing_item_exact(session, name, shopping_date, store_id)
    else:
        return _find_existing_item(session, name, shopping_date, store_id)


def _add_or_merge_ingredient_item(
    session,
    name: str,
    menge: str,
    shopping_date: str,
    store: Store,
    modified_items: List[Item],
) -> None:
    """Add new item or merge with existing item in shopping list.

    Args:
        session: Database session
        name: Item name
        menge: Quantity string
        shopping_date: Shopping date
        store: Store object
        modified_items: List to append modified items to
    """
    import uuid
    from ..routers.items import _find_matching_product
    from ..utils import merge_quantities

    existing_item = _find_item_by_match_strategy(session, name, shopping_date, store.id)

    if existing_item:
        # Merge quantities
        merged_menge = merge_quantities(existing_item.menge, menge)
        if merged_menge is None or merged_menge.strip() == "":
            session.delete(existing_item)
        else:
            existing_item.menge = merged_menge
            session.add(existing_item)
            modified_items.append(existing_item)
    else:
        # Create new item
        new_item = Item(
            id=str(uuid.uuid4()),
            name=name,
            menge=menge,
            store_id=store.id,
            shopping_date=shopping_date,
            user_id=None,
        )

        # Find matching product
        product_id = _find_matching_product(session, new_item)
        if product_id:
            new_item.product_id = product_id

        session.add(new_item)
        modified_items.append(new_item)


def _process_recipe_ingredients(
    session,
    ingredient_lines: List[str],
    pattern,
    removed_items: set,
    weekplan_date: str,
    first_store: Store,
    meal: str,
    person_count: Optional[int],
    original_quantity: Optional[int],
    modified_items: List[Item],
) -> None:
    """Process recipe ingredients and add them to shopping list.

    Args:
        session: Database session
        ingredient_lines: List of ingredient lines from recipe
        pattern: Compiled regex pattern for parsing ingredients
        removed_items: Set of items to skip
        weekplan_date: Weekplan date
        first_store: Store object
        meal: Meal type
        person_count: Optional person count for scaling
        original_quantity: Original recipe quantity
        modified_items: List to append modified items to
    """
    for line in ingredient_lines:
        quantity_str, name = _parse_ingredient_line(line, pattern)

        # Skip items that are marked as removed in deltas
        if name in removed_items:
            continue

        # Adjust quantity based on person_count if provided
        # Default to "1" if no quantity is specified
        item_menge = quantity_str if quantity_str else "1"
        if person_count is not None and quantity_str:
            item_menge = _adjust_quantity_by_person_count(
                quantity_str, person_count, original_quantity
            )

        # Calculate shopping date
        shopping_date = _calculate_shopping_date(
            weekplan_date, name, first_store, session, meal
        )

        _add_or_merge_ingredient_item(
            session, name, item_menge, shopping_date, first_store, modified_items
        )


def _process_delta_items(
    session,
    delta_items: List,
    weekplan_date: str,
    first_store: Store,
    meal: str,
    modified_items: List[Item],
) -> None:
    """Process delta added items and add them to shopping list.

    Args:
        session: Database session
        delta_items: List of delta items to add
        weekplan_date: Weekplan date
        first_store: Store object
        meal: Meal type
        modified_items: List to append modified items to
    """
    for delta_item in delta_items:
        # Calculate shopping date
        shopping_date = _calculate_shopping_date(
            weekplan_date, delta_item.name, first_store, session, meal
        )

        _add_or_merge_ingredient_item(
            session,
            delta_item.name,
            delta_item.menge,
            shopping_date,
            first_store,
            modified_items,
        )


def _add_recipe_items_to_shopping_list(
    session,
    recipe_id: int,
    weekplan_date: str,
    meal: str,
    deltas: Optional[WeekplanDeltas] = None,
) -> List[Item]:
    """Add recipe ingredients to shopping list.

    Args:
        session: Database session
        recipe_id: ID of the recipe
        weekplan_date: Date from weekplan entry (YYYY-MM-DD)
        meal: Meal type ('morning', 'lunch', 'dinner')
        deltas: Optional deltas to apply (removed items, added items, person_count)

    Returns:
        List of items that were added or modified
    """
    modified_items = []

    # Check if weekplan date is in the past
    weekplan_datetime = datetime.fromisoformat(weekplan_date)
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    if weekplan_datetime.date() < today.date():
        return modified_items  # Don't add items for past dates

    # Get recipe
    recipe = session.get(Recipe, recipe_id)
    if not recipe:
        return modified_items  # No recipe found

    # Parse recipe data using helper
    ingredients_text, original_quantity, ingredient_lines = _parse_recipe_data(recipe)
    if not ingredients_text:
        return modified_items

    # Get first store by sort_order
    first_store = session.exec(
        select(Store).order_by(Store.sort_order, Store.id)
    ).first()

    if not first_store:
        return modified_items  # No store available

    # Get person_count from deltas if available
    person_count = deltas.person_count if deltas else None

    # Create ingredient pattern
    pattern = _create_ingredient_pattern(session)

    # Create set of removed items for fast lookup
    removed_items = (
        _create_removed_items_set(deltas.removed_items, pattern) if deltas else set()
    )

    # Process recipe ingredients
    _process_recipe_ingredients(
        session,
        ingredient_lines,
        pattern,
        removed_items,
        weekplan_date,
        first_store,
        meal,
        person_count,
        original_quantity,
        modified_items,
    )

    # Commit all ingredient items at once
    session.commit()

    # Add items from deltas.added_items
    if deltas and deltas.added_items:
        _process_delta_items(
            session,
            deltas.added_items,
            weekplan_date,
            first_store,
            meal,
            modified_items,
        )
        # Commit all added items at once
        session.commit()

    return modified_items


def _subtract_ingredient_item(
    session,
    name: str,
    menge: str,
    shopping_date: str,
    store: Store,
    modified_items: List[Item],
    deleted_items: List[Item],
) -> None:
    """Subtract quantity from existing item in shopping list.

    Args:
        session: Database session
        name: Item name
        menge: Quantity string to subtract
        shopping_date: Shopping date
        store: Store object
        modified_items: List to append modified items to
        deleted_items: List to append deleted items to
    """
    existing_item = _find_item_by_match_strategy(session, name, shopping_date, store.id)

    if existing_item and menge:
        _subtract_item_quantity(
            existing_item,
            menge,
            session,
            modified_items,
            deleted_items,
        )


def _process_recipe_ingredients_removal(
    session,
    ingredient_lines: List[str],
    pattern,
    removed_items: set,
    weekplan_date: str,
    first_store: Store,
    meal: str,
    person_count: Optional[int],
    original_quantity: Optional[int],
    modified_items: List[Item],
    deleted_items: List[Item],
) -> None:
    """Process recipe ingredients and remove them from shopping list.

    Args:
        session: Database session
        ingredient_lines: List of ingredient lines from recipe
        pattern: Compiled regex pattern for parsing ingredients
        removed_items: Set of items to skip
        weekplan_date: Weekplan date
        first_store: Store object
        meal: Meal type
        person_count: Optional person count for scaling
        original_quantity: Original recipe quantity
        modified_items: List to append modified items to
        deleted_items: List to append deleted items to
    """
    for line in ingredient_lines:
        quantity_str, name = _parse_ingredient_line(line, pattern)

        # Skip items that were marked as removed in deltas (they were never added)
        if name in removed_items:
            continue

        # Calculate shopping date using helper function
        shopping_date = _calculate_shopping_date(
            weekplan_date, name, first_store, session, meal
        )

        # Adjust quantity based on person_count if provided
        # Default to "1" if no quantity is specified
        item_menge = quantity_str if quantity_str else "1"
        if person_count is not None and quantity_str:
            item_menge = _adjust_quantity_by_person_count(
                quantity_str, person_count, original_quantity
            )

        _subtract_ingredient_item(
            session,
            name,
            item_menge,
            shopping_date,
            first_store,
            modified_items,
            deleted_items,
        )


def _process_delta_items_removal(
    session,
    delta_items: List,
    weekplan_date: str,
    first_store: Store,
    meal: str,
    modified_items: List[Item],
    deleted_items: List[Item],
) -> None:
    """Process delta items and remove them from shopping list.

    Args:
        session: Database session
        delta_items: List of delta items to remove
        weekplan_date: Weekplan date
        first_store: Store object
        meal: Meal type
        modified_items: List to append modified items to
        deleted_items: List to append deleted items to
    """
    for delta_item in delta_items:
        # Calculate shopping date
        shopping_date = _calculate_shopping_date(
            weekplan_date, delta_item.name, first_store, session, meal
        )

        _subtract_ingredient_item(
            session,
            delta_item.name,
            delta_item.menge,
            shopping_date,
            first_store,
            modified_items,
            deleted_items,
        )


def _remove_recipe_items_from_shopping_list(
    session,
    recipe_id: int,
    weekplan_date: str,
    meal: str,
    deltas: Optional[WeekplanDeltas] = None,
) -> tuple[List[Item], List[Item]]:
    """Remove recipe items from shopping list when weekplan entry is deleted.

    This reverses the action of _add_recipe_items_to_shopping_list by
    subtracting the recipe ingredient quantities from the shopping list.

    Args:
        session: Database session
        recipe_id: ID of the recipe
        weekplan_date: Date from weekplan entry (YYYY-MM-DD)
        meal: Meal type ('morning', 'lunch', 'dinner')
        deltas: Optional deltas to apply (removed items, added items)

    Returns:
        Tuple of (modified_items, deleted_items)
    """
    modified_items = []
    deleted_items = []

    # Check if weekplan date is in the past
    weekplan_datetime = datetime.fromisoformat(weekplan_date)
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    if weekplan_datetime.date() < today.date():
        return modified_items, deleted_items  # Don't remove items for past dates

    # Get recipe from database
    recipe = session.get(Recipe, recipe_id)
    if not recipe:
        return modified_items, deleted_items  # Recipe not found

    # Parse recipe data using helper
    ingredients_text, original_quantity, ingredient_lines = _parse_recipe_data(recipe)
    if not ingredients_text:
        return modified_items, deleted_items

    # Get first store by sort_order
    first_store = session.exec(
        select(Store).order_by(Store.sort_order, Store.id)
    ).first()

    if not first_store:
        return modified_items, deleted_items  # No store available

    # Get person_count from deltas if available
    person_count = deltas.person_count if deltas else None

    # Create ingredient pattern
    pattern = _create_ingredient_pattern(session)

    # Create set of removed items for fast lookup
    removed_items = (
        _create_removed_items_set(deltas.removed_items, pattern) if deltas else set()
    )

    # Process recipe ingredients
    _process_recipe_ingredients_removal(
        session,
        ingredient_lines,
        pattern,
        removed_items,
        weekplan_date,
        first_store,
        meal,
        person_count,
        original_quantity,
        modified_items,
        deleted_items,
    )

    # Remove items from deltas.added_items
    if deltas and deltas.added_items:
        _process_delta_items_removal(
            session,
            deltas.added_items,
            weekplan_date,
            first_store,
            meal,
            modified_items,
            deleted_items,
        )

    return modified_items, deleted_items


def _remove_template_items_from_shopping_list(
    session,
    template_name: str,
    weekplan_date: str,
    meal: str,
    deltas: Optional[WeekplanDeltas] = None,
) -> tuple[List[Item], List[Item]]:
    """Remove template items from shopping list when weekplan entry is deleted.

    This reverses the action of _add_template_items_to_shopping_list by
    subtracting the template quantities from the shopping list.

    Args:
        session: Database session
        template_name: Name of the template to check
        weekplan_date: Date from weekplan entry (YYYY-MM-DD)
        meal: Meal type ('morning', 'lunch', 'dinner')
        deltas: Optional deltas to apply (removed items, added items)

    Returns:
        Tuple of (modified_items, deleted_items)
    """
    from ..routers.items import _find_existing_item

    modified_items = []
    deleted_items = []

    # Check if weekplan date is in the past
    weekplan_datetime = datetime.fromisoformat(weekplan_date)
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    if weekplan_datetime.date() < today.date():
        return modified_items, deleted_items  # Don't remove items for past dates

    # Check if template exists with exact match
    template = session.exec(
        select(ShoppingTemplate).where(ShoppingTemplate.name == template_name)
    ).first()

    if not template:
        return modified_items, deleted_items  # No matching template, nothing to do

    # Get first store by sort_order
    first_store = session.exec(
        select(Store).order_by(Store.sort_order, Store.id)
    ).first()

    if not first_store:
        return modified_items, deleted_items  # No store available

    # Create set of removed items for fast lookup
    removed_items = set(deltas.removed_items) if deltas else set()

    # Get person_count from deltas if available
    person_count = deltas.person_count if deltas else None

    # Remove each template item from shopping list (unless it was removed in deltas)
    for template_item in template.template_items:
        # Skip items that were marked as removed in deltas (they were never added)
        if template_item.name in removed_items:
            continue
        # Calculate shopping date using helper function (same logic as add)
        shopping_date = _calculate_shopping_date(
            weekplan_date, template_item.name, first_store, session, meal
        )

        # Adjust quantity based on person_count if provided
        item_menge = template_item.menge
        if person_count is not None:
            item_menge = _adjust_quantity_by_person_count(
                template_item.menge, person_count, template.person_count
            )

        # Subtract quantities using merge logic
        # Find existing item with same name, date, and store
        existing_item = _find_existing_item(
            session, template_item.name, shopping_date, first_store.id
        )

        if existing_item and item_menge:
            _subtract_item_quantity(
                existing_item,
                item_menge,
                session,
                modified_items,
                deleted_items,
            )

    # Remove items from deltas.added_items
    if deltas and deltas.added_items:
        for delta_item in deltas.added_items:
            # Calculate shopping date
            shopping_date = _calculate_shopping_date(
                weekplan_date, delta_item.name, first_store, session, meal
            )

            # Find existing item (uses fuzzy matching for templates)
            existing_item = _find_existing_item(
                session, delta_item.name, shopping_date, first_store.id
            )

            if existing_item and delta_item.menge:
                _subtract_item_quantity(
                    existing_item,
                    delta_item.menge,
                    session,
                    modified_items,
                    deleted_items,
                )

    return modified_items, deleted_items


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
                id=entry.id,
                date=entry.date,
                meal=entry.meal,
                text=entry.text,
                entry_type=entry.entry_type,
                recipe_id=entry.recipe_id,
                template_id=entry.template_id,
                deltas=(
                    WeekplanDeltas(**json.loads(entry.deltas)) if entry.deltas else None
                ),
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

        # Serialize deltas to JSON if provided
        deltas_json = None
        if entry.deltas:
            deltas_json = json.dumps(entry.deltas.model_dump())

        # Create entry (shared, no user_id)
        db_entry = WeekplanEntry(
            date=entry.date,
            meal=entry.meal,
            text=entry.text,
            entry_type=entry.entry_type or "text",
            recipe_id=entry.recipe_id,
            template_id=entry.template_id,
            deltas=deltas_json,
        )
        session.add(db_entry)
        session.commit()
        session.refresh(db_entry)

        # Add items to shopping list based on entry_type
        modified_items = []
        if entry.entry_type == "recipe" and entry.recipe_id:
            # Entry is a recipe
            modified_items = _add_recipe_items_to_shopping_list(
                session, entry.recipe_id, entry.date, entry.meal, entry.deltas
            )
        elif entry.entry_type == "template":
            # Entry is a template - use text to find template
            modified_items = _add_template_items_to_shopping_list(
                session, entry.text, entry.date, entry.meal, entry.deltas
            )
        elif entry.recipe_id:
            # Fallback for backward compatibility: check if entry has a recipe_id
            modified_items = _add_recipe_items_to_shopping_list(
                session, entry.recipe_id, entry.date, entry.meal, entry.deltas
            )
        else:
            # Fallback: check if entry text matches a shopping template
            modified_items = _add_template_items_to_shopping_list(
                session, entry.text, entry.date, entry.meal, entry.deltas
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
            id=db_entry.id,
            date=db_entry.date,
            meal=db_entry.meal,
            text=db_entry.text,
            entry_type=db_entry.entry_type,
            recipe_id=db_entry.recipe_id,
            template_id=db_entry.template_id,
            deltas=entry.deltas,
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

        # Parse deltas from entry
        entry_deltas = None
        if entry.deltas:
            entry_deltas = WeekplanDeltas(**json.loads(entry.deltas))

        # Remove items from shopping list based on entry type
        # Do this BEFORE deleting the entry so we still have access to entry data
        if entry.entry_type == "recipe" and entry.recipe_id:
            # Entry is a recipe - remove recipe ingredients
            modified_items, deleted_items = _remove_recipe_items_from_shopping_list(
                session, entry.recipe_id, entry.date, entry.meal, entry_deltas
            )
        elif entry.entry_type == "template":
            # Entry is a template - remove template items
            modified_items, deleted_items = _remove_template_items_from_shopping_list(
                session, entry.text, entry.date, entry.meal, entry_deltas
            )
        elif entry.recipe_id:
            # Fallback for backward compatibility: entry has a recipe_id
            modified_items, deleted_items = _remove_recipe_items_from_shopping_list(
                session, entry.recipe_id, entry.date, entry.meal, entry_deltas
            )
        else:
            # Fallback: entry text might match a template
            modified_items, deleted_items = _remove_template_items_from_shopping_list(
                session, entry.text, entry.date, entry.meal, entry_deltas
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

        # Broadcast deleted items
        for item in deleted_items:
            await manager.broadcast(
                {
                    "type": "item:deleted",
                    "data": {"id": item.id},
                }
            )

        # Delete entry (no ownership check - shared across all users)
        session.delete(entry)
        session.commit()

        return {"message": "Entry deleted successfully"}


def _handle_merged_items(
    existing_item: any, menge: str, session: get_session, modified_items: list
):
    """Handle merging of existing item with quantity (helper function).

    Args:
        existing_item: Existing Item instance
        menge: quantity string
        session: Database session
        modified_items: list to append modified items to
    """
    from ..utils import merge_quantities

    merged_menge = merge_quantities(existing_item.menge, menge)
    if merged_menge is None or merged_menge.strip() == "":
        session.delete(existing_item)
    else:
        existing_item.menge = merged_menge
        session.add(existing_item)
        modified_items.append(existing_item)


def _create_negative_quantity(menge: str) -> str:
    """Create negative quantity string from given quantity.

    Args:
        menge: quantity string
    Returns:
        Negative quantity string
    """
    from ..utils import parse_quantity

    parsed_num, unit = parse_quantity(menge)
    if parsed_num is not None:
        if parsed_num == int(parsed_num):
            negative_menge = f"-{int(parsed_num)}"
        else:
            negative_menge = f"-{parsed_num}"
        if unit:
            negative_menge = f"{negative_menge} {unit}"
        return negative_menge
    return ""


def _subtract_item_quantity(
    existing_item: Item,
    quantity_to_subtract: str,
    session,
    modified_items: list,
    deleted_items: list,
) -> None:
    """Subtract quantity from an existing item, delete if quantity reaches zero.

    Args:
        existing_item: Existing Item instance
        quantity_to_subtract: Quantity string to subtract
        session: Database session
        modified_items: List to append modified items to
        deleted_items: List to append deleted items to
    """
    from ..utils import merge_quantities

    negative_menge = _create_negative_quantity(quantity_to_subtract)
    if not negative_menge:
        return

    merged_menge = merge_quantities(existing_item.menge, negative_menge)

    if merged_menge is None or merged_menge.strip() == "":
        # Quantity reduced to zero or below, delete item
        deleted_items.append(existing_item)
        session.delete(existing_item)
    else:
        # Update with reduced quantity
        existing_item.menge = merged_menge
        session.add(existing_item)
        modified_items.append(existing_item)

    session.commit()


def _find_item_to_modify(
    item_name: str,
    entry: WeekplanEntry,
    first_store: Store,
    session: get_session,
) -> tuple:
    """Find item to modify in shopping list (helper function).

    Args:
        item_name: Name of the item
        entry: WeekplanEntry instance
        first_store: Store instance
        session: Database session
    Returns:
        Tuple of (existing_item, shopping_date) where:
            existing_item: Existing Item instance or None
            shopping_date: Calculated shopping date (str)
    """
    from ..routers.items import _find_existing_item

    # Calculate shopping date
    shopping_date = _calculate_shopping_date(
        entry.date, item_name, first_store, session, entry.meal
    )
    # Find and remove/reduce quantity
    existing_item = _find_existing_item(
        session, item_name, shopping_date, first_store.id
    )
    return existing_item, shopping_date


def _remove_newly_marked_items(
    newly_removed: set,
    template: ShoppingTemplate | None,
    entry: WeekplanEntry | None,
    first_store: Store | None,
    session: get_session,
    modified_items: list,
    person_count: Optional[int] = None,
):
    """Remove newly marked items from shopping list (helper function).

    Args:
        newly_removed (set): set of newly removed item names
        template (ShoppingTemplate| None): ShoppingTemplate instance
        entry (WeekplanEntry | None): WeekplanEntry instance
        first_store (Store | None): Store instance
        session (get_session): function to get DB session
        modified_items (list): list to append modified items to
        person_count (Optional[int]): person count for quantity adjustment
    """
    # Remove newly marked items from shopping list
    for item_name in newly_removed:
        # Find the template item to get its quantity
        template_item = next(
            (ti for ti in template.template_items if ti.name == item_name),
            None,
        )
        if not template_item:
            continue
        # Find and remove/reduce quantity
        existing_item, _ = _find_item_to_modify(item_name, entry, first_store, session)
        if existing_item and template_item.menge:
            # Adjust quantity by person_count if provided
            item_menge = template_item.menge
            if person_count is not None:
                item_menge = _adjust_quantity_by_person_count(
                    template_item.menge, person_count, template.person_count
                )

            # Create negative quantity for subtraction
            negative_menge = _create_negative_quantity(item_menge)
            if negative_menge:
                # Merge with negative quantity
                _handle_merged_items(
                    existing_item, negative_menge, session, modified_items
                )
                session.commit()


def _add_back_unmarked_items(
    newly_added_back: set,
    template: ShoppingTemplate | None,
    entry: WeekplanEntry | None,
    first_store: Store | None,
    session: get_session,
    modified_items: list,
    person_count: Optional[int] = None,
):
    """Add back items that were unmarked (no longer removed).

    Args:
        newly_added_back (set): set of item names that are no longer removed
        template (ShoppingTemplate| None): ShoppingTemplate instance
        entry (WeekplanEntry | None): WeekplanEntry instance
        first_store (Store | None): Store instance
        session (get_session): function to get DB session
        modified_items (list): list to append modified items to
        person_count (Optional[int]): person count for quantity adjustment
    """
    import uuid
    from ..routers.items import _find_matching_product

    for item_name in newly_added_back:
        # Find the template item to get its quantity
        template_item = next(
            (ti for ti in template.template_items if ti.name == item_name),
            None,
        )
        if not template_item:
            continue

        # Adjust quantity by person_count if provided
        item_menge = template_item.menge
        if person_count is not None:
            item_menge = _adjust_quantity_by_person_count(
                template_item.menge, person_count, template.person_count
            )

        # Find or create item
        existing_item, shopping_date = _find_item_to_modify(
            item_name, entry, first_store, session
        )

        if existing_item:
            # Merge quantities
            _handle_merged_items(existing_item, item_menge, session, modified_items)
        else:
            # Create new item
            new_item = Item(
                id=str(uuid.uuid4()),
                name=item_name,
                menge=item_menge,
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


def _remove_items_from_added(
    removed_from_added: set,
    old_added_items: dict,
    entry: WeekplanEntry | None,
    first_store: Store | None,
    session: get_session,
    modified_items: list,
):
    """Remove items that were deleted from added_items.

    Args:
        removed_from_added (set): set of item names removed from added_items
        old_added_items (dict): dict mapping item names to delta items
        entry (WeekplanEntry | None): WeekplanEntry instance
        first_store (Store | None): Store instance
        session (get_session): function to get DB session
        modified_items (list): list to append modified items to
    """
    for item_name in removed_from_added:
        delta_item = old_added_items[item_name]

        # Find and remove item
        existing_item, _ = _find_item_to_modify(
            delta_item.name, entry, first_store, session
        )

        if existing_item and delta_item.menge:
            # Create negative quantity for subtraction
            negative_menge = _create_negative_quantity(delta_item.menge)
            if negative_menge:
                # Merge with negative quantity
                _handle_merged_items(
                    existing_item, negative_menge, session, modified_items
                )

                session.commit()


def _handle_recipe_person_count_change(
    old_person_count: Optional[int],
    new_person_count: Optional[int],
    recipe: Recipe,
    entry: WeekplanEntry,
    first_store: Store,
    old_removed: set,
    new_removed: set,
    session,
    modified_items: list,
):
    """Handle person_count changes for recipes."""
    from ..routers.items import _find_matching_product
    from ..utils import merge_quantities
    import uuid

    # Parse recipe data using helper
    _, original_quantity, ingredient_lines = _parse_recipe_data(recipe)

    # Create ingredient pattern
    pattern = _create_ingredient_pattern(session)

    # Remove items with old person_count
    for line in ingredient_lines:
        quantity_str, name = _parse_ingredient_line(line, pattern)

        if name in old_removed:
            continue

        shopping_date = _calculate_shopping_date(
            entry.date, name, first_store, session, entry.meal
        )

        # Calculate old quantity
        if old_person_count is not None and quantity_str:
            old_menge = _adjust_quantity_by_person_count(
                quantity_str, old_person_count, original_quantity
            )
        else:
            old_menge = quantity_str

        # Find existing item using intelligent matching strategy
        existing_item = _find_item_by_match_strategy(
            session, name, shopping_date, first_store.id
        )

        if existing_item and old_menge:
            deleted_items = []
            _subtract_item_quantity(
                existing_item, old_menge, session, modified_items, deleted_items
            )

    # Add items with new person_count
    if new_person_count is not None:
        for line in ingredient_lines:
            quantity_str, name = _parse_ingredient_line(line, pattern)

            if name in new_removed:
                continue

            shopping_date = _calculate_shopping_date(
                entry.date, name, first_store, session, entry.meal
            )

            new_menge = (
                _adjust_quantity_by_person_count(
                    quantity_str, new_person_count, original_quantity
                )
                if quantity_str
                else None
            )

            # Find existing item using intelligent matching strategy
            existing_item = _find_item_by_match_strategy(
                session, name, shopping_date, first_store.id
            )

            if existing_item and new_menge:
                merged_menge = merge_quantities(existing_item.menge, new_menge)
                if merged_menge and merged_menge.strip():
                    existing_item.menge = merged_menge
                    session.add(existing_item)
                    modified_items.append(existing_item)
            elif new_menge:
                new_item = Item(
                    id=str(uuid.uuid4()),
                    name=name,
                    menge=new_menge,
                    store_id=first_store.id,
                    shopping_date=shopping_date,
                    user_id=None,
                )
                product_id = _find_matching_product(session, new_item)
                if product_id:
                    new_item.product_id = product_id
                session.add(new_item)
                modified_items.append(new_item)


def _remove_newly_marked_recipe_items(
    newly_removed: set,
    recipe: Recipe,
    entry: WeekplanEntry,
    first_store: Store,
    session,
    modified_items: list,
    person_count: Optional[int] = None,
):
    """Remove newly marked recipe items from shopping list."""
    # Parse recipe data using helper
    _, original_quantity, ingredient_lines = _parse_recipe_data(recipe)

    # Create ingredient pattern
    pattern = _create_ingredient_pattern(session)

    for line in ingredient_lines:
        quantity_str, name = _parse_ingredient_line(line, pattern)

        if name not in newly_removed:
            continue

        shopping_date = _calculate_shopping_date(
            entry.date, name, first_store, session, entry.meal
        )

        # Default to "1" if no quantity is specified
        item_menge = quantity_str if quantity_str else "1"
        if person_count is not None and quantity_str:
            item_menge = _adjust_quantity_by_person_count(
                quantity_str, person_count, original_quantity
            )

        # Find existing item using intelligent matching strategy
        existing_item = _find_item_by_match_strategy(
            session, name, shopping_date, first_store.id
        )

        if existing_item and item_menge:
            negative_menge = _create_negative_quantity(item_menge)
            if negative_menge:
                _handle_merged_items(
                    existing_item, negative_menge, session, modified_items
                )


def _calculate_delta_changes(
    old_deltas: Optional[WeekplanDeltas],
    new_deltas: WeekplanDeltas,
) -> tuple[set, set, bool]:
    """Calculate changes between old and new deltas.

    Args:
        old_deltas: Previous deltas (can be None)
        new_deltas: New deltas

    Returns:
        Tuple of (newly_removed, newly_added_back, person_count_changed)
    """
    old_removed = set(old_deltas.removed_items) if old_deltas else set()
    new_removed = set(new_deltas.removed_items)

    newly_removed = new_removed - old_removed
    newly_added_back = old_removed - new_removed

    old_person_count = old_deltas.person_count if old_deltas else None
    new_person_count = new_deltas.person_count
    person_count_changed = old_person_count != new_person_count

    return newly_removed, newly_added_back, person_count_changed


def _handle_added_items_changes(
    old_deltas: Optional[WeekplanDeltas],
    new_deltas: WeekplanDeltas,
    entry: WeekplanEntry,
    first_store: Store,
    session,
    modified_items: list,
) -> None:
    """Handle changes in added_items between old and new deltas.

    Args:
        old_deltas: Previous deltas
        new_deltas: New deltas
        entry: Weekplan entry
        first_store: Store object
        session: Database session
        modified_items: List to append modified items to
    """
    old_added_list = old_deltas.added_items if old_deltas else []
    old_added_items = {item.name: item for item in old_added_list}
    new_added_items = {item.name: item for item in new_deltas.added_items}

    # Find items that were newly added
    newly_added_item_names = set(new_added_items.keys()) - set(old_added_items.keys())

    # Find items that were removed from added_items
    removed_from_added = set(old_added_items.keys()) - set(new_added_items.keys())

    # Remove items that were deleted from added_items
    _remove_items_from_added(
        removed_from_added,
        old_added_items,
        entry,
        first_store,
        session,
        modified_items,
    )

    # Add newly added items
    _add_newly_added_items(
        newly_added_item_names,
        new_added_items,
        entry,
        first_store,
        session,
        modified_items,
    )


def _update_recipe_deltas(
    entry: WeekplanEntry,
    old_deltas: Optional[WeekplanDeltas],
    new_deltas: WeekplanDeltas,
    session,
    modified_items: list,
) -> None:
    """Update recipe deltas and adjust shopping list accordingly.

    Args:
        entry: Weekplan entry
        old_deltas: Previous deltas
        new_deltas: New deltas
        session: Database session
        modified_items: List to append modified items to
    """
    # Get recipe from database
    recipe = session.get(Recipe, entry.recipe_id)
    if not recipe:
        return

    # Parse removed items to remove parentheses for consistent matching
    pattern = _create_ingredient_pattern(session)

    old_removed = (
        _create_removed_items_set(old_deltas.removed_items, pattern)
        if old_deltas and old_deltas.removed_items
        else set()
    )

    new_removed = (
        _create_removed_items_set(new_deltas.removed_items, pattern)
        if new_deltas.removed_items
        else set()
    )

    # Calculate which items were newly marked as removed
    newly_removed = new_removed - old_removed

    # Calculate which items were unmarked (no longer removed)
    newly_added_back = old_removed - new_removed

    # Check if person_count has changed
    old_person_count = old_deltas.person_count if old_deltas else None
    new_person_count = new_deltas.person_count
    person_count_changed = old_person_count != new_person_count

    # Get first store
    first_store = session.exec(
        select(Store).order_by(Store.sort_order, Store.id)
    ).first()

    if not first_store:
        return

    # If person_count changed, recalculate all recipe items
    if person_count_changed:
        _handle_recipe_person_count_change(
            old_person_count,
            new_person_count,
            recipe,
            entry,
            first_store,
            old_removed,
            new_removed,
            session,
            modified_items,
        )

    # Remove newly marked items from shopping list
    _remove_newly_marked_recipe_items(
        newly_removed,
        recipe,
        entry,
        first_store,
        session,
        modified_items,
        new_person_count,
    )

    # Add back items that were unmarked
    _add_back_unmarked_recipe_items(
        newly_added_back,
        recipe,
        entry,
        first_store,
        session,
        modified_items,
        new_person_count,
    )

    # Handle newly added items
    _handle_added_items_changes(
        old_deltas,
        new_deltas,
        entry,
        first_store,
        session,
        modified_items,
    )


def _update_template_deltas(
    entry: WeekplanEntry,
    old_deltas: Optional[WeekplanDeltas],
    new_deltas: WeekplanDeltas,
    session,
    modified_items: list,
) -> None:
    """Update template deltas and adjust shopping list accordingly.

    Args:
        entry: Weekplan entry
        old_deltas: Previous deltas
        new_deltas: New deltas
        session: Database session
        modified_items: List to append modified items to
    """
    # Check if entry text matches a template
    template = session.exec(
        select(ShoppingTemplate).where(ShoppingTemplate.name == entry.text)
    ).first()

    if not template:
        return

    # Calculate delta changes
    newly_removed, newly_added_back, person_count_changed = _calculate_delta_changes(
        old_deltas, new_deltas
    )

    old_person_count = old_deltas.person_count if old_deltas else None
    new_person_count = new_deltas.person_count

    old_removed = set(old_deltas.removed_items) if old_deltas else set()
    new_removed = set(new_deltas.removed_items)

    # Get first store
    first_store = session.exec(
        select(Store).order_by(Store.sort_order, Store.id)
    ).first()

    if not first_store:
        return

    # If person_count changed, delegate to helper function
    if person_count_changed:
        _handle_person_count_change(
            old_person_count,
            new_person_count,
            template,
            entry,
            first_store,
            old_removed,
            new_removed,
            session,
            modified_items,
        )

    # Remove newly marked items from shopping list
    _remove_newly_marked_items(
        newly_removed,
        template,
        entry,
        first_store,
        session,
        modified_items,
        new_person_count,
    )

    # Add back items that were unmarked
    _add_back_unmarked_items(
        newly_added_back,
        template,
        entry,
        first_store,
        session,
        modified_items,
        new_person_count,
    )

    # Handle newly added items
    _handle_added_items_changes(
        old_deltas,
        new_deltas,
        entry,
        first_store,
        session,
        modified_items,
    )


def _add_back_unmarked_recipe_items(
    newly_added_back: set,
    recipe: Recipe,
    entry: WeekplanEntry,
    first_store: Store,
    session,
    modified_items: list,
    person_count: Optional[int] = None,
):
    """Add back recipe items that were unmarked."""
    import uuid
    from ..routers.items import _find_matching_product

    # Parse recipe data using helper
    _, original_quantity, ingredient_lines = _parse_recipe_data(recipe)

    # Create ingredient pattern
    pattern = _create_ingredient_pattern(session)

    for line in ingredient_lines:
        quantity_str, name = _parse_ingredient_line(line, pattern)

        if name not in newly_added_back:
            continue

        # Default to "1" if no quantity is specified
        item_menge = quantity_str if quantity_str else "1"
        if person_count is not None and quantity_str:
            item_menge = _adjust_quantity_by_person_count(
                quantity_str, person_count, original_quantity
            )

        existing_item, shopping_date = _find_item_to_modify(
            name, entry, first_store, session
        )

        if existing_item and item_menge:
            _handle_merged_items(existing_item, item_menge, session, modified_items)
        elif item_menge:
            new_item = Item(
                id=str(uuid.uuid4()),
                name=name,
                menge=item_menge,
                store_id=first_store.id,
                shopping_date=shopping_date,
                user_id=None,
            )
            product_id = _find_matching_product(session, new_item)
            if product_id:
                new_item.product_id = product_id
            session.add(new_item)
            modified_items.append(new_item)


def _handle_person_count_change(
    old_person_count: Optional[int],
    new_person_count: Optional[int],
    template: ShoppingTemplate | None,
    entry: WeekplanEntry | None,
    first_store: Store | None,
    old_removed: set,
    new_removed: set,
    session: get_session,
    modified_items: list,
):
    """Handle person_count changes by removing old quantities and adding new ones.

    Args:
        old_person_count (Optional[int]): Previous person count (None if not set)
        new_person_count (Optional[int]): New person count
        template (ShoppingTemplate | None): ShoppingTemplate instance
        entry (WeekplanEntry | None): WeekplanEntry instance
        first_store (Store | None): Store instance
        old_removed (set): Set of previously removed item names
        new_removed (set): Set of currently removed item names
        session (get_session): Database session
        modified_items (list): List to append modified items to
    """
    from ..routers.items import _find_existing_item, _find_matching_product
    from ..utils import merge_quantities
    import uuid

    # Remove items with old person_count (or original if old was None)
    for template_item in template.template_items:
        if template_item.name in old_removed:
            continue  # Skip items that were already removed

        shopping_date = _calculate_shopping_date(
            entry.date, template_item.name, first_store, session, entry.meal
        )

        # If old_person_count is None, use original template quantity
        if old_person_count is not None:
            old_menge = _adjust_quantity_by_person_count(
                template_item.menge, old_person_count, template.person_count
            )
        else:
            old_menge = template_item.menge

        existing_item = _find_existing_item(
            session, template_item.name, shopping_date, first_store.id
        )

        if existing_item and old_menge:
            deleted_items = []
            _subtract_item_quantity(
                existing_item, old_menge, session, modified_items, deleted_items
            )

    # Add items with new person_count
    if new_person_count is not None:
        for template_item in template.template_items:
            if template_item.name in new_removed:
                continue  # Skip items that are marked as removed

            shopping_date = _calculate_shopping_date(
                entry.date, template_item.name, first_store, session, entry.meal
            )

            new_menge = _adjust_quantity_by_person_count(
                template_item.menge, new_person_count, template.person_count
            )

            existing_item = _find_existing_item(
                session, template_item.name, shopping_date, first_store.id
            )

            if existing_item:
                merged_menge = merge_quantities(existing_item.menge, new_menge)
                if merged_menge and merged_menge.strip():
                    existing_item.menge = merged_menge
                    session.add(existing_item)
                    modified_items.append(existing_item)
            else:
                new_item = Item(
                    id=str(uuid.uuid4()),
                    name=template_item.name,
                    menge=new_menge,
                    store_id=first_store.id,
                    shopping_date=shopping_date,
                    user_id=None,
                )
                product_id = _find_matching_product(session, new_item)
                if product_id:
                    new_item.product_id = product_id
                session.add(new_item)
                modified_items.append(new_item)

            session.commit()


def _add_newly_added_items(
    newly_added_item_names: set,
    new_added_items: dict,
    entry: WeekplanEntry | None,
    first_store: Store | None,
    session: get_session,
    modified_items: list,
):
    """Add newly added items to the shopping list.

    Args:
        newly_added_item_names (set): set of newly added item names
        new_added_items (dict): dict mapping item names to delta items
        entry (WeekplanEntry | None): WeekplanEntry instance
        first_store (Store | None): Store instance
        session (get_session): function to get DB session
        modified_items (list): list to append modified items to
    """
    import uuid
    from ..routers.items import _find_matching_product

    for item_name in newly_added_item_names:
        delta_item = new_added_items[item_name]

        # Calculate shopping date
        existing_item, shopping_date = _find_item_to_modify(
            delta_item.name, entry, first_store, session
        )

        if existing_item:
            # Merge quantities
            _handle_merged_items(
                existing_item, delta_item.menge, session, modified_items
            )
        else:
            # Create new item
            new_item = Item(
                id=str(uuid.uuid4()),
                name=delta_item.name,
                menge=delta_item.menge,
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


@router.patch("/entries/{entry_id}/deltas", response_model=WeekplanEntryResponse)
async def update_weekplan_entry_deltas(
    entry_id: int,
    deltas: WeekplanDeltas,
    current_user: str = Depends(get_current_user),
):
    """Update the deltas for a weekplan entry.

    Args:
        entry_id: Entry ID
        deltas: Delta modifications (removed items, added items)
        current_user: Current authenticated username from JWT (for authentication only)

    Returns:
        Updated weekplan entry
    """
    with get_session() as session:
        # Verify user is authenticated
        user = session.exec(select(User).where(User.username == current_user)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Get entry
        entry = session.get(WeekplanEntry, entry_id)
        if not entry:
            raise HTTPException(status_code=404, detail="Weekplan entry not found")

        # Parse old deltas to detect changes
        old_deltas = None
        if entry.deltas:
            old_deltas = WeekplanDeltas(**json.loads(entry.deltas))

        modified_items = []

        # Handle recipes or templates
        if entry.recipe_id:
            _update_recipe_deltas(entry, old_deltas, deltas, session, modified_items)
        else:
            _update_template_deltas(entry, old_deltas, deltas, session, modified_items)

        # Update deltas
        entry.deltas = json.dumps(deltas.model_dump())
        session.add(entry)
        session.commit()
        session.refresh(entry)

        # Broadcast shopping list changes
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

        # Broadcast update to all connected clients
        await manager.broadcast(
            {
                "type": "weekplan:deltas_updated",
                "data": {
                    "id": entry.id,
                    "date": entry.date,
                    "meal": entry.meal,
                    "text": entry.text,
                    "deltas": deltas.model_dump(),
                },
            }
        )

        return WeekplanEntryResponse(
            id=entry.id,
            date=entry.date,
            meal=entry.meal,
            text=entry.text,
            deltas=deltas,
        )
