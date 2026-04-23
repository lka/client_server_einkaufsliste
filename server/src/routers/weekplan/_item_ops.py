"""Low-level item operations: add/merge, subtract, find."""

import uuid
from typing import List

from ...models import Store, Item
from ..items import _find_item_by_match_strategy, _find_matching_product
from ...utils import merge_quantities, parse_quantity
from ._utils import _calculate_shopping_date
from ... import app_state


def _handle_merged_items(
    existing_item,
    menge: str,
    session,
    modified_items: list,
    deleted_items: list | None = None,
):
    """Handle merging of existing item with quantity."""
    merged_menge = merge_quantities(existing_item.menge, menge)
    if merged_menge is None or merged_menge.strip() == "":
        if deleted_items is not None:
            deleted_items.append(existing_item)
        session.delete(existing_item)
    else:
        existing_item.menge = merged_menge
        session.add(existing_item)
        modified_items.append(existing_item)


def _create_negative_quantity(menge: str) -> str:
    """Create negative quantity string from given quantity."""
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
    """Subtract quantity from an existing item, delete if quantity reaches zero."""
    negative_menge = _create_negative_quantity(quantity_to_subtract)
    if not negative_menge:
        return

    merged_menge = merge_quantities(existing_item.menge, negative_menge)

    if merged_menge is None or merged_menge.strip() == "":
        deleted_items.append(existing_item)
        session.delete(existing_item)
    else:
        existing_item.menge = merged_menge
        session.add(existing_item)
        modified_items.append(existing_item)

    session.commit()


def _find_item_to_modify(
    item_name: str,
    entry,
    first_store: Store,
    session,
) -> tuple:
    """Find item to modify in shopping list.

    Returns:
        Tuple of (existing_item, shopping_date)
    """
    shopping_date = _calculate_shopping_date(
        entry.date,
        item_name,
        first_store,
        session,
        entry.meal,
        single_shopping_day=app_state.single_shopping_day_enabled,
    )
    existing_item = _find_item_by_match_strategy(
        session, item_name, shopping_date, first_store.id
    )
    return existing_item, shopping_date


def _add_or_merge_ingredient_item(
    session,
    name: str,
    menge: str,
    shopping_date: str,
    store: Store,
    modified_items: List[Item],
) -> None:
    """Add new item or merge with existing item in shopping list."""
    existing_item = _find_item_by_match_strategy(session, name, shopping_date, store.id)

    if existing_item:
        merged_menge = merge_quantities(existing_item.menge, menge)
        if merged_menge is None or merged_menge.strip() == "":
            session.delete(existing_item)
        else:
            existing_item.menge = merged_menge
            session.add(existing_item)
            modified_items.append(existing_item)
    else:
        new_item = Item(
            id=str(uuid.uuid4()),
            name=name,
            menge=menge,
            store_id=store.id,
            shopping_date=shopping_date,
            user_id=None,
        )

        product_id = _find_matching_product(session, new_item)
        if product_id:
            new_item.product_id = product_id

        session.add(new_item)
        modified_items.append(new_item)
