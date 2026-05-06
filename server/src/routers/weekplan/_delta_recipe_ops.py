"""Recipe-specific delta operations (mark/unmark, person count, update)."""

import uuid
from typing import Optional

from ...models import Store, Item, Recipe, WeekplanEntry
from ..items import _find_item_by_match_strategy, _find_matching_product
from ...utils import merge_quantities
from ... import app_state
from ._models import WeekplanDeltas
from ._utils import (
    _adjust_quantity_by_person_count,
    _calculate_shopping_date,
    _calculate_delta_changes,
    _parse_recipe_data,
    _create_ingredient_pattern,
    _parse_ingredient_line,
    _create_removed_items_set,
)
from ._item_ops import (
    _handle_merged_items,
    _create_negative_quantity,
    _subtract_item_quantity,
    _find_item_to_modify,
)
from ._delta_item_ops import _handle_added_items_changes


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
    deleted_items: list | None = None,
):
    """Handle person_count changes for recipes."""
    _, original_quantity, ingredient_lines = _parse_recipe_data(recipe)
    pattern = _create_ingredient_pattern(session)

    for line in ingredient_lines:
        quantity_str, name = _parse_ingredient_line(line, pattern)

        if name in old_removed:
            continue

        shopping_date = _calculate_shopping_date(
            entry.date,
            name,
            first_store,
            session,
            entry.meal,
            single_shopping_day=app_state.single_shopping_day_enabled,
        )

        if old_person_count is not None and quantity_str:
            old_menge = _adjust_quantity_by_person_count(
                quantity_str, old_person_count, original_quantity
            )
        else:
            old_menge = quantity_str

        existing_item = _find_item_by_match_strategy(
            session, name, shopping_date, first_store.id
        )

        if existing_item and old_menge:
            _subtract_item_quantity(
                existing_item, old_menge, session, modified_items, deleted_items or []
            )

    if new_person_count is not None:
        for line in ingredient_lines:
            quantity_str, name = _parse_ingredient_line(line, pattern)

            if name in new_removed:
                continue

            shopping_date = _calculate_shopping_date(
                entry.date,
                name,
                first_store,
                session,
                entry.meal,
                single_shopping_day=app_state.single_shopping_day_enabled,
            )

            new_menge = (
                _adjust_quantity_by_person_count(
                    quantity_str, new_person_count, original_quantity
                )
                if quantity_str
                else None
            )

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
    deleted_items: list | None = None,
    person_count: Optional[int] = None,
):
    """Remove newly marked recipe items from shopping list."""
    _, original_quantity, ingredient_lines = _parse_recipe_data(recipe)
    pattern = _create_ingredient_pattern(session)

    for line in ingredient_lines:
        quantity_str, name = _parse_ingredient_line(line, pattern)

        if name not in newly_removed:
            continue

        shopping_date = _calculate_shopping_date(
            entry.date,
            name,
            first_store,
            session,
            entry.meal,
            single_shopping_day=app_state.single_shopping_day_enabled,
        )

        item_menge = quantity_str if quantity_str else "1"
        if person_count is not None and quantity_str:
            item_menge = _adjust_quantity_by_person_count(
                quantity_str, person_count, original_quantity
            )

        existing_item = _find_item_by_match_strategy(
            session, name, shopping_date, first_store.id
        )

        if existing_item and item_menge:
            negative_menge = _create_negative_quantity(item_menge)
            if negative_menge:
                _handle_merged_items(
                    existing_item,
                    negative_menge,
                    session,
                    modified_items,
                    deleted_items,
                )


def _add_back_unmarked_recipe_items(
    newly_added_back: set,
    recipe: Recipe,
    entry: WeekplanEntry,
    first_store: Store,
    session,
    modified_items: list,
    deleted_items: list | None = None,
    person_count: Optional[int] = None,
):
    """Add back recipe items that were unmarked."""
    _, original_quantity, ingredient_lines = _parse_recipe_data(recipe)
    pattern = _create_ingredient_pattern(session)

    for line in ingredient_lines:
        quantity_str, name = _parse_ingredient_line(line, pattern)

        if name not in newly_added_back:
            continue

        item_menge = quantity_str if quantity_str else "1"
        if person_count is not None and quantity_str:
            item_menge = _adjust_quantity_by_person_count(
                quantity_str, person_count, original_quantity
            )

        existing_item, shopping_date = _find_item_to_modify(
            name, entry, first_store, session
        )

        if existing_item and item_menge:
            _handle_merged_items(
                existing_item, item_menge, session, modified_items, deleted_items
            )
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


def _update_recipe_deltas(
    entry: WeekplanEntry,
    old_deltas: Optional[WeekplanDeltas],
    new_deltas: WeekplanDeltas,
    session,
    modified_items: list,
    deleted_items: list | None = None,
) -> None:
    """Update recipe deltas and adjust shopping list accordingly."""
    from sqlmodel import select
    from ...models import Store

    recipe = session.get(Recipe, entry.recipe_id)
    if not recipe:
        return

    pattern = _create_ingredient_pattern(session)
    (
        old_removed,
        new_removed,
        newly_removed,
        newly_added_back,
        person_count_changed,
    ) = _calculate_delta_changes(
        old_deltas,
        new_deltas,
        lambda items: _create_removed_items_set(items, pattern),
    )

    old_person_count = old_deltas.person_count if old_deltas else None
    new_person_count = new_deltas.person_count

    first_store = session.exec(
        select(Store).order_by(Store.sort_order, Store.id)
    ).first()

    if not first_store:
        return

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
            deleted_items,
        )

    _remove_newly_marked_recipe_items(
        newly_removed,
        recipe,
        entry,
        first_store,
        session,
        modified_items,
        deleted_items,
        new_person_count,
    )

    _add_back_unmarked_recipe_items(
        newly_added_back,
        recipe,
        entry,
        first_store,
        session,
        modified_items,
        deleted_items,
        new_person_count,
    )

    _handle_added_items_changes(
        old_deltas,
        new_deltas,
        entry,
        first_store,
        session,
        modified_items,
        deleted_items,
    )
