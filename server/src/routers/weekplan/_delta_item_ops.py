"""Item-level delta operations: mark/unmark template items."""

import uuid
from typing import Optional

from ...models import ShoppingTemplate, Store, Item, WeekplanEntry
from ..items import _find_matching_product
from ._models import WeekplanDeltas
from ._utils import _adjust_quantity_by_person_count
from ._item_ops import (
    _handle_merged_items,
    _create_negative_quantity,
    _find_item_to_modify,
)


def _remove_newly_marked_items(
    newly_removed: set,
    template: ShoppingTemplate | None,
    entry: WeekplanEntry | None,
    first_store: Store | None,
    session,
    modified_items: list,
    deleted_items: list | None = None,
    person_count: Optional[int] = None,
):
    """Remove newly marked items from shopping list."""
    for item_name in newly_removed:
        template_item = next(
            (ti for ti in template.template_items if ti.name == item_name),
            None,
        )
        if not template_item:
            continue
        existing_item, _ = _find_item_to_modify(item_name, entry, first_store, session)
        if existing_item and template_item.menge:
            item_menge = template_item.menge
            if person_count is not None:
                item_menge = _adjust_quantity_by_person_count(
                    template_item.menge, person_count, template.person_count
                )

            negative_menge = _create_negative_quantity(item_menge)
            if negative_menge:
                _handle_merged_items(
                    existing_item,
                    negative_menge,
                    session,
                    modified_items,
                    deleted_items,
                )
                session.commit()


def _add_back_unmarked_items(
    newly_added_back: set,
    template: ShoppingTemplate | None,
    entry: WeekplanEntry | None,
    first_store: Store | None,
    session,
    modified_items: list,
    deleted_items: list | None = None,
    person_count: Optional[int] = None,
):
    """Add back items that were unmarked (no longer removed)."""
    for item_name in newly_added_back:
        template_item = next(
            (ti for ti in template.template_items if ti.name == item_name),
            None,
        )
        if not template_item:
            continue

        item_menge = template_item.menge
        if person_count is not None:
            item_menge = _adjust_quantity_by_person_count(
                template_item.menge, person_count, template.person_count
            )

        existing_item, shopping_date = _find_item_to_modify(
            item_name, entry, first_store, session
        )

        if existing_item:
            _handle_merged_items(
                existing_item, item_menge, session, modified_items, deleted_items
            )
        else:
            new_item = Item(
                id=str(uuid.uuid4()),
                name=item_name,
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

        session.commit()


def _remove_items_from_added(
    removed_from_added: set,
    old_added_items: dict,
    entry: WeekplanEntry | None,
    first_store: Store | None,
    session,
    modified_items: list,
    deleted_items: list | None = None,
):
    """Remove items that were deleted from added_items."""
    for item_name in removed_from_added:
        delta_item = old_added_items[item_name]

        existing_item, _ = _find_item_to_modify(
            delta_item.name, entry, first_store, session
        )

        if existing_item and delta_item.menge:
            negative_menge = _create_negative_quantity(delta_item.menge)
            if negative_menge:
                _handle_merged_items(
                    existing_item,
                    negative_menge,
                    session,
                    modified_items,
                    deleted_items,
                )

                session.commit()


def _add_newly_added_items(
    newly_added_item_names: set,
    new_added_items: dict,
    entry: WeekplanEntry | None,
    first_store: Store | None,
    session,
    modified_items: list,
):
    """Add newly added items to the shopping list."""
    for item_name in newly_added_item_names:
        delta_item = new_added_items[item_name]

        existing_item, shopping_date = _find_item_to_modify(
            delta_item.name, entry, first_store, session
        )

        if existing_item:
            _handle_merged_items(
                existing_item, delta_item.menge, session, modified_items
            )
        else:
            new_item = Item(
                id=str(uuid.uuid4()),
                name=delta_item.name,
                menge=delta_item.menge,
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


def _handle_added_items_changes(
    old_deltas: Optional[WeekplanDeltas],
    new_deltas: WeekplanDeltas,
    entry: WeekplanEntry,
    first_store: Store,
    session,
    modified_items: list,
    deleted_items: list | None = None,
) -> None:
    """Handle changes in added_items between old and new deltas."""
    old_added_list = old_deltas.added_items if old_deltas else []
    old_added_items = {item.name: item for item in old_added_list}
    new_added_items = {item.name: item for item in new_deltas.added_items}

    newly_added_item_names = set(new_added_items.keys()) - set(old_added_items.keys())
    removed_from_added = set(old_added_items.keys()) - set(new_added_items.keys())

    _remove_items_from_added(
        removed_from_added,
        old_added_items,
        entry,
        first_store,
        session,
        modified_items,
        deleted_items,
    )

    _add_newly_added_items(
        newly_added_item_names,
        new_added_items,
        entry,
        first_store,
        session,
        modified_items,
    )
