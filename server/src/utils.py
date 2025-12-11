"""Utility functions for item and quantity management."""

import re
from difflib import SequenceMatcher
from sqlmodel import select

from .models import Item


def _convert_fraction_to_decimal(fraction_str: str) -> float | None:
    """Convert unicode fraction characters to decimal.

    Args:
        fraction_str: String containing unicode fractions like ½, ¼, ¾, 1½, etc.

    Returns:
        Float value or None if conversion fails

    Examples:
        - "½" -> 0.5
        - "¼" -> 0.25
        - "¾" -> 0.75
        - "1½" -> 1.5
        - "2¼" -> 2.25
    """
    # Common unicode fractions
    fractions_map = {
        "½": 0.5,
        "¼": 0.25,
        "¾": 0.75,
        "⅓": 0.333,
        "⅔": 0.667,
        "⅕": 0.2,
        "⅖": 0.4,
        "⅗": 0.6,
        "⅘": 0.8,
        "⅙": 0.167,
        "⅚": 0.833,
        "⅐": 0.143,
        "⅑": 0.111,
        "⅛": 0.125,
        "⅜": 0.375,
        "⅝": 0.625,
        "⅞": 0.875,
    }

    # Try to match pattern like "1½" (number + fraction)
    match = re.match(r"^(-?\d+)([½¼¾⅓⅔⅕⅖⅗⅘⅙⅚⅐⅑⅛⅜⅝⅞])$", fraction_str)
    if match:
        whole_part = int(match.group(1))
        fraction_char = match.group(2)
        if fraction_char in fractions_map:
            return (
                abs(whole_part) + fractions_map[fraction_char]
                if whole_part >= 0
                else -(abs(whole_part) + fractions_map[fraction_char])
            )
        return None

    # Try to match just fraction (no whole number)
    if fraction_str in fractions_map:
        return fractions_map[fraction_str]

    return None


def parse_quantity(menge: str | None) -> tuple[float | None, str | None]:
    """Parse quantity string into number and unit.

    Args:
        menge: Quantity string like "500 g", "2 Stück",
            "½ TL", "1½ kg", or "-300 g" for subtraction

    Returns:
        Tuple of (number, unit) or (None, None) if parsing fails
        Number can be negative for subtraction

    Examples:
        - "500 g" -> (500.0, "g")
        - "½ TL" -> (0.5, "TL")
        - "1½ kg" -> (1.5, "kg")
        - "2¼ l" -> (2.25, "l")
        - "-300 g" -> (-300.0, "g")
    """
    if not menge:
        return None, None

    menge_stripped = menge.strip()

    # First try to match fractions with optional minus sign
    # Pattern: optional minus, optional number, fraction character, optional unit
    fraction_match = re.match(
        r"^(-?)(\d*)([½¼¾⅓⅔⅕⅖⅗⅘⅙⅚⅐⅑⅛⅜⅝⅞])\s*(.*)$", menge_stripped
    )
    if fraction_match:
        minus_sign = fraction_match.group(1)
        whole_part_str = fraction_match.group(2)
        fraction_char = fraction_match.group(3)
        unit = fraction_match.group(4).strip() if fraction_match.group(4) else None

        # Build the fraction string for conversion
        fraction_str = (whole_part_str if whole_part_str else "") + fraction_char
        number = _convert_fraction_to_decimal(fraction_str)

        if number is not None:
            # Apply minus sign if present
            if minus_sign == "-":
                number = -number
            return number, unit

    # Fall back to regular number parsing (supports minus sign, int/float)
    match = re.match(r"^(-?\d+(?:[.,]\d+)?)\s*(.*)$", menge_stripped)
    if match:
        number_str = match.group(1).replace(",", ".")
        unit = match.group(2).strip() if match.group(2) else None
        try:
            number = float(number_str)
            return number, unit
        except ValueError:
            return None, None

    return None, None


def normalize_name(name: str) -> str:
    """Normalize name for comparison.

    Converts to lowercase and normalizes German umlauts for consistent comparison.

    Args:
        name: Name to normalize

    Returns:
        Normalized name string
    """
    s = name.lower().strip()
    # Normalize German umlauts
    s = s.replace("ä", "ae").replace("ö", "oe").replace("ü", "ue")
    s = s.replace("ß", "ss")
    return s


def find_similar_item(
    session,
    item_name: str,
    user_id: int,
    threshold: float = 0.8,
    shopping_date: str | None = None,
    store_id: str | None = None,
) -> Item | None:
    """Find an item with a similar name using fuzzy matching for a specific user.

    Args:
        session: Database session
        item_name: Name to search for
        user_id: User ID to filter items
        threshold: Similarity threshold (0.0 to 1.0, default 0.8)
        shopping_date: Optional shopping date to match (items with
            different dates won't be merged)
        store_id: Optional store ID to filter items (items from
            different stores won't be merged)

    Returns:
        Item with most similar name above threshold, or None

    Examples:
        - "Möhre" matches "Möhren"
        - "Moehre" matches "Möhren"
        - "Kartoffel" matches "Kartoffeln"
    """
    # Get all items for this user with same shopping_date
    query = select(Item).where(Item.user_id == user_id)
    if shopping_date is not None:
        query = query.where(Item.shopping_date == shopping_date)
    else:
        # Only match items without shopping_date
        query = query.where(Item.shopping_date.is_(None))

    # Only match items from the same store if store_id is provided
    if store_id is not None:
        query = query.where(Item.store_id == store_id)

    all_items = session.exec(query).all()

    if not all_items:
        return None

    normalized_input = normalize_name(item_name)
    best_match = None
    best_ratio = 0.0

    for existing_item in all_items:
        normalized_existing = normalize_name(existing_item.name)

        # Calculate similarity ratio
        ratio = SequenceMatcher(None, normalized_input, normalized_existing).ratio()

        if ratio > best_ratio and ratio >= threshold:
            best_ratio = ratio
            best_match = existing_item

    return best_match


def _validate_quantities(
    existing_menge: str | None, new_menge: str | None
) -> tuple[bool, str | None]:
    """Validate quantities and handle edge cases.

    Returns:
        (should_continue, result): If should_continue is False,
                                   return result immediately
    """
    if not existing_menge:
        if new_menge:
            parsed_num, _ = parse_quantity(new_menge)
            if parsed_num is not None and parsed_num < 0:
                return (False, None)  # Can't subtract from nothing
        return (False, new_menge)

    if not new_menge:
        return (False, existing_menge)

    return (True, None)  # Continue with merge logic


def _format_quantity_value(total: float, unit: str | None) -> str:
    """Format a quantity value with its unit."""
    # Use int if whole number, otherwise float
    if total == int(total):
        total_str = str(int(total))
    else:
        total_str = str(total).replace(".", ",")

    if unit:
        return f"{total_str} {unit}"
    return total_str


def _merge_single_part(
    new_part: str, existing_parts: list[str]
) -> tuple[list[str], bool]:
    """Merge a single quantity part with existing parts.

    Returns:
        (merged_parts, found_match): List of merged parts and whether a match was found
    """
    new_num, new_unit = parse_quantity(new_part)

    if new_num is None:
        # Can't parse - just append it
        return (existing_parts + [new_part], False)

    found_match = False
    merged_parts = []

    for part in existing_parts:
        part_num, part_unit = parse_quantity(part)

        if part_num is not None and part_unit == new_unit and not found_match:
            # Found match - sum them (supports subtraction)
            total = part_num + new_num

            # Only add if total is positive
            if total > 0:
                merged_parts.append(_format_quantity_value(total, part_unit))
            # If total <= 0, skip this part (remove it from the list)
            found_match = True
        else:
            # Keep existing part as-is
            merged_parts.append(part)

    return (merged_parts, found_match)


def merge_quantities(existing_menge: str | None, new_menge: str | None) -> str | None:
    """Merge two quantities, searching for matching units in comma-separated list.

    Supports both addition and subtraction. Negative quantities (starting with -)
    are subtracted from existing quantities.

    Args:
        existing_menge: Existing quantity string (may be semicolon-separated
        like "500 g; 2 Packungen")
        new_menge: New quantity to add/subtract
                   (may be semicolon-separated like "2; 500 g")
                   Use negative values for subtraction (e.g., "-300 g")

    Returns:
        Merged quantity string. If unit exists in list, adds/subtracts it.
        Otherwise appends to list. Items with zero or negative quantities are removed.

    Examples:
        - merge_quantities("500 g", "300 g") -> "800 g"
        - merge_quantities("500 g", "-300 g") -> "200 g"
        - merge_quantities("500 g", "-600 g") -> None (quantity becomes negative)
        - merge_quantities(None, "-1") -> None (can't subtract from nothing)
        - merge_quantities("500 g", "2 Packungen") -> "500 g; 2 Packungen"
        - merge_quantities("500 g; 2 Packungen", "300 g") -> "800 g; 2 Packungen"
        - merge_quantities("500 g; 2 Packungen", "3 Packungen") -> "500 g; 5 Packungen"
        - merge_quantities("500 g", "2; 300 g") -> "800 g; 2"
    """
    # Check if we should continue or return early
    should_continue, early_result = _validate_quantities(existing_menge, new_menge)
    if not should_continue:
        return early_result

    # Split new_menge by semicolon and process each part separately
    new_parts = [part.strip() for part in new_menge.split(";")]

    # Start with existing quantities
    result_menge = existing_menge

    # Merge each new part one at a time
    for new_part in new_parts:
        if not new_part:
            continue

        # Split current result quantities by semicolon
        existing_parts = [part.strip() for part in result_menge.split(";")]

        merged_parts, found_match = _merge_single_part(new_part, existing_parts)

        # If no match found and new_num is positive, append new part
        # If new_num is negative, ignore it (can't subtract from nothing)
        if not found_match:
            new_num, _ = parse_quantity(new_part)
            if new_num is not None and new_num > 0:
                merged_parts.append(new_part)

        result_menge = "; ".join(merged_parts)

    # If result is empty, return None (all quantities were subtracted to zero or below)
    return result_menge if result_menge.strip() else None
