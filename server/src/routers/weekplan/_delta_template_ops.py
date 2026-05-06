"""Template-specific delta operations (mark/unmark, person count, update)."""

import uuid
from typing import Optional

from sqlmodel import select

from ...models import ShoppingTemplate, Store, Item, WeekplanEntry
from ..items import _find_item_by_match_strategy, _find_matching_product
from ...utils import merge_quantities
from ... import app_state
from ._models import WeekplanDeltas
from ._utils import (
    _adjust_quantity_by_person_count,
    _calculate_shopping_date,
    _calculate_delta_changes,
)
from ._item_ops import _subtract_item_quantity
from ._delta_item_ops import (
    _remove_newly_marked_items,
    _add_back_unmarked_items,
    _handle_added_items_changes,
)


def _handle_person_count_change(
    old_person_count: Optional[int],
    new_person_count: Optional[int],
    template: ShoppingTemplate | None,
    entry: WeekplanEntry | None,
    first_store: Store | None,
    old_removed: set,
    new_removed: set,
    session,
    modified_items: list,
    deleted_items: list | None = None,
):
    """Handle person_count changes by removing old quantities and adding new ones."""
    for template_item in template.template_items:
        if template_item.name in old_removed:
            continue

        shopping_date = _calculate_shopping_date(
            entry.date,
            template_item.name,
            first_store,
            session,
            entry.meal,
            single_shopping_day=app_state.single_shopping_day_enabled,
        )

        if old_person_count is not None:
            old_menge = _adjust_quantity_by_person_count(
                template_item.menge, old_person_count, template.person_count
            )
        else:
            old_menge = template_item.menge

        existing_item = _find_item_by_match_strategy(
            session, template_item.name, shopping_date, first_store.id
        )

        if existing_item and old_menge:
            _subtract_item_quantity(
                existing_item, old_menge, session, modified_items, deleted_items or []
            )

    if new_person_count is not None:
        for template_item in template.template_items:
            if template_item.name in new_removed:
                continue

            shopping_date = _calculate_shopping_date(
                entry.date,
                template_item.name,
                first_store,
                session,
                entry.meal,
                single_shopping_day=app_state.single_shopping_day_enabled,
            )

            new_menge = _adjust_quantity_by_person_count(
                template_item.menge, new_person_count, template.person_count
            )

            existing_item = _find_item_by_match_strategy(
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


def _update_template_deltas(
    entry: WeekplanEntry,
    old_deltas: Optional[WeekplanDeltas],
    new_deltas: WeekplanDeltas,
    session,
    modified_items: list,
    deleted_items: list | None = None,
) -> None:
    """Update template deltas and adjust shopping list accordingly."""
    template = session.exec(
        select(ShoppingTemplate).where(ShoppingTemplate.name == entry.text)
    ).first()

    if not template:
        return

    (
        old_removed,
        new_removed,
        newly_removed,
        newly_added_back,
        person_count_changed,
    ) = _calculate_delta_changes(old_deltas, new_deltas)

    old_person_count = old_deltas.person_count if old_deltas else None
    new_person_count = new_deltas.person_count

    first_store = session.exec(
        select(Store).order_by(Store.sort_order, Store.id)
    ).first()

    if not first_store:
        return

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
            deleted_items,
        )

    _remove_newly_marked_items(
        newly_removed,
        template,
        entry,
        first_store,
        session,
        modified_items,
        deleted_items,
        new_person_count,
    )

    _add_back_unmarked_items(
        newly_added_back,
        template,
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
