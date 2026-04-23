"""Date, quantity, and ingredient utility functions for weekplan."""

import os
import json
import re
from typing import List, Optional
from datetime import datetime, timedelta
from sqlmodel import select

from ...models import Store, Product, Recipe, Unit
from ..items import _enrich_with_department


def _item_to_broadcast_data(session, item) -> dict:
    """Build item data dict with department info for WebSocket broadcast."""
    enriched = _enrich_with_department(session, item)
    return {
        "id": enriched.id,
        "name": enriched.name,
        "menge": enriched.menge,
        "store_id": enriched.store_id,
        "product_id": enriched.product_id,
        "shopping_date": enriched.shopping_date,
        "user_id": enriched.user_id,
        "department_id": enriched.department_id,
        "department_name": enriched.department_name,
        "department_sort_order": enriched.department_sort_order,
    }


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
    """
    if not original_menge:
        return original_menge

    from ...utils import parse_quantity

    value, unit = parse_quantity(original_menge)

    if value is None:
        return original_menge

    if not original_person_count or original_person_count == 0:
        return original_menge

    factor = person_count / original_person_count
    adjusted_value = value * factor

    if adjusted_value % 1 == 0:
        formatted_value = str(int(adjusted_value))
    else:
        formatted_value = f"{adjusted_value:.2f}".rstrip("0").rstrip(".")

    return f"{formatted_value} {unit}" if unit else formatted_value


def _calculate_shopping_date(
    weekplan_date: str,
    template_item_name: str,
    first_store: Store,
    session,
    meal: str,
    single_shopping_day: bool = False,
) -> str:
    """Calculate the appropriate shopping date for a template item."""
    main_shopping_day = int(os.getenv("MAIN_SHOPPING_DAY", "2"))
    fresh_products_day = int(os.getenv("FRESH_PRODUCTS_DAY", "4"))

    weekplan_datetime = datetime.fromisoformat(weekplan_date)

    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    next_main_shopping = _get_next_weekday(today, main_shopping_day)
    next_fresh_products = _get_next_weekday(today, fresh_products_day)

    allow_same_day = meal == "dinner"

    if next_main_shopping.date() > weekplan_datetime.date():
        if allow_same_day and today.date() <= weekplan_datetime.date():
            next_main_shopping = today
        elif not allow_same_day and today.date() < weekplan_datetime.date():
            next_main_shopping = today
        else:
            next_main_shopping = today
    elif not allow_same_day and next_main_shopping.date() == weekplan_datetime.date():
        if today.date() < weekplan_datetime.date():
            next_main_shopping = today

    if next_fresh_products.date() < today.date():
        next_fresh_products = next_fresh_products + timedelta(days=7)

    if next_fresh_products.date() > weekplan_datetime.date():
        next_fresh_products = next_main_shopping
    elif not allow_same_day and next_fresh_products.date() == weekplan_datetime.date():
        if today.date() < weekplan_datetime.date():
            next_fresh_products = today
        else:
            next_fresh_products = next_main_shopping

    shopping_date = next_main_shopping.date().isoformat()

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

    if (
        not single_shopping_day
        and is_fresh
        and weekplan_datetime.date() >= next_fresh_products.date()
    ):
        shopping_date = next_fresh_products.date().isoformat()

    return shopping_date


def _get_known_units(session) -> list[str]:
    """Return list of known measurement units for ingredient parsing from database."""
    units = session.exec(select(Unit).order_by(Unit.sort_order)).all()
    return [unit.name for unit in units]


def _parse_recipe_data(recipe: Recipe) -> tuple[str, int, list[str]]:
    """Parse recipe data and return ingredients text, original quantity, and lines."""
    recipe_data = json.loads(recipe.data)
    ingredients_text = recipe_data.get("ingredients", "")

    quantity = recipe_data.get("quantity", 1)
    try:
        original_quantity = int(quantity) if quantity else 1
    except (ValueError, TypeError):
        original_quantity = 1

    ingredient_lines = [
        line.strip()
        for line in ingredients_text.split("\n")
        if line.strip() and not re.search(r"<[^>]+>", line.strip())
    ]

    return ingredients_text, original_quantity, ingredient_lines


def _create_ingredient_pattern(session):
    """Create regex pattern for parsing ingredients with known units."""
    known_units = _get_known_units(session)
    units_pattern = "|".join(known_units)

    return re.compile(
        rf"^((?:\d*[½¼¾⅓⅔⅕⅖⅗⅘⅙⅚⅐⅑⅛⅜⅝⅞]|\d+\s*\d+/\d+|\d+/\d+|[\d\.,]+)"
        rf"(?:\s*(?:{units_pattern}))?)\s+(.+)$"
    )


def _normalize_quantity(quantity_str: str | None) -> str | None:
    """Normalize quantity string by converting text fractions to decimals."""
    if not quantity_str:
        return quantity_str

    from ...utils import parse_quantity

    number, unit = parse_quantity(quantity_str)

    if number is None:
        return quantity_str

    if number == int(number):
        formatted_number = str(int(number))
    else:
        formatted_number = str(number).replace(".", ",")

    if unit:
        return f"{formatted_number} {unit}"
    return formatted_number


def _parse_ingredient_line(line: str, pattern) -> tuple[str | None, str]:
    """Parse a single ingredient line into quantity and name."""
    match = pattern.match(line)
    if match:
        quantity_str = match.group(1).strip()
        name = match.group(2).strip()
        quantity_str = _normalize_quantity(quantity_str)
    else:
        quantity_str = None
        name = line.strip()

    name = re.sub(r"\s*\([^)]*\)", "", name).strip()

    return quantity_str, name


def _create_removed_items_set(removed_items: List[str], pattern) -> set:
    """Create set of removed items for fast lookup."""
    return {
        _parse_ingredient_line(item_name, pattern)[1] for item_name in removed_items
    }
