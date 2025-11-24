"""Utility functions for item and quantity management."""

import re
from difflib import SequenceMatcher
from sqlmodel import select

from .models import Item


def parse_quantity(menge: str | None) -> tuple[float | None, str | None]:
    """Parse quantity string into number and unit.

    Args:
        menge: Quantity string like "500 g", "2 Stück", or "-300 g" for subtraction

    Returns:
        Tuple of (number, unit) or (None, None) if parsing fails
        Number can be negative for subtraction
    """
    if not menge:
        return None, None

    # Match optional minus sign, number (int/float), optional unit
    match = re.match(r"^(-?\d+(?:[.,]\d+)?)\s*(.*)$", menge.strip())
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
    if not existing_menge:
        # If there's no existing quantity, check if new quantity is negative
        # Can't subtract from nothing - return None to indicate deletion
        if new_menge:
            parsed_num, _ = parse_quantity(new_menge)
            if parsed_num is not None and parsed_num < 0:
                return None  # Negative quantity without existing = delete item
        return new_menge
    if not new_menge:
        return existing_menge

    # Split new_menge by semicolon and process each part separately
    new_parts = [part.strip() for part in new_menge.split(";")]

    # Start with existing quantities
    result_menge = existing_menge

    # Merge each new part one at a time
    for new_part in new_parts:
        if not new_part:
            continue

        # Parse this part of the new quantity
        new_num, new_unit = parse_quantity(new_part)

        if new_num is None:
            # Can't parse - just append it
            result_menge = f"{result_menge}; {new_part}"
            continue

        # Split current result quantities by semicolon
        existing_parts = [part.strip() for part in result_menge.split(";")]

        # Try to find matching unit in existing parts
        found_match = False
        merged_parts = []

        for part in existing_parts:
            part_num, part_unit = parse_quantity(part)

            if part_num is not None and part_unit == new_unit and not found_match:
                # Found match - sum them (supports subtraction)
                total = part_num + new_num

                # Only add to merged_parts if total is positive
                if total > 0:
                    # Format nicely: use int if whole number, otherwise float
                    if total == int(total):
                        total_str = str(int(total))
                    else:
                        total_str = str(total).replace(".", ",")

                    if part_unit:
                        merged_parts.append(f"{total_str} {part_unit}")
                    else:
                        merged_parts.append(total_str)
                # If total <= 0, skip this part (remove it from the list)
                found_match = True
            else:
                # Keep existing part as-is
                merged_parts.append(part)

        # If no match found and new_num is positive, append new part
        # If new_num is negative, ignore it (can't subtract from nothing)
        if not found_match and new_num > 0:
            merged_parts.append(new_part)

        result_menge = "; ".join(merged_parts)

    # If result is empty, return None (all quantities were subtracted to zero or below)
    return result_menge if result_menge.strip() else None
