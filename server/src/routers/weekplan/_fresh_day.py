"""Fresh day merge/split operations."""

import os
import json
from datetime import datetime
from sqlmodel import select

from ...models import Store, Item, Product, Recipe, ShoppingTemplate, WeekplanEntry
from ...db import get_session
from ...websocket_manager import manager
from ..items import _find_item_by_match_strategy
from ...utils import merge_quantities
from ._models import WeekplanDeltas
from ._utils import (
    _get_next_weekday,
    _item_to_broadcast_data,
    _create_ingredient_pattern,
    _parse_ingredient_line,
    _parse_recipe_data,
    _create_removed_items_set,
    _adjust_quantity_by_person_count,
)
from ._item_ops import _add_or_merge_ingredient_item, _subtract_item_quantity


def _collect_recipe_items_for_entry(
    session,
    entry: WeekplanEntry,
    entry_deltas,
    pattern,
) -> list[tuple[str, str | None]]:
    """Collect (name, menge) pairs from a recipe-based weekplan entry."""
    recipe = session.get(Recipe, entry.recipe_id)
    if not recipe:
        return []
    _, original_quantity, ingredient_lines = _parse_recipe_data(recipe)
    person_count = entry_deltas.person_count if entry_deltas else None
    removed_set = (
        _create_removed_items_set(list(entry_deltas.removed_items), pattern)
        if entry_deltas and entry_deltas.removed_items
        else set()
    )
    result: list[tuple[str, str | None]] = []
    for line in ingredient_lines:
        qty_str, name = _parse_ingredient_line(line, pattern)
        if name in removed_set:
            continue
        menge = qty_str if qty_str else "1"
        if person_count and qty_str:
            menge = _adjust_quantity_by_person_count(
                qty_str, person_count, original_quantity
            )
        result.append((name, menge))
    return result


def _collect_template_items_for_entry(
    session,
    entry: WeekplanEntry,
    entry_deltas,
) -> list[tuple[str, str | None]]:
    """Collect (name, menge) pairs from a template-based weekplan entry."""
    template = session.exec(
        select(ShoppingTemplate).where(ShoppingTemplate.name == entry.text)
    ).first()
    if not template:
        return []
    person_count = entry_deltas.person_count if entry_deltas else None
    removed_set = (
        set(entry_deltas.removed_items)
        if entry_deltas and entry_deltas.removed_items
        else set()
    )
    result: list[tuple[str, str | None]] = []
    for ti in template.template_items:
        if ti.name in removed_set:
            continue
        menge = ti.menge
        if person_count:
            menge = _adjust_quantity_by_person_count(
                menge, person_count, template.person_count
            )
        result.append((ti.name, menge))
    return result


def _collect_entry_items_for_fresh_split(
    session,
    entry: WeekplanEntry,
    pattern,
) -> list[tuple[str, str | None]]:
    """Collect all (name, menge) pairs\
    from a weekplan entry (recipe, template, deltas)."""
    entry_deltas = WeekplanDeltas(**json.loads(entry.deltas)) if entry.deltas else None

    is_recipe = (entry.entry_type == "recipe" and entry.recipe_id) or (
        entry.recipe_id and entry.entry_type != "template"
    )
    if is_recipe:
        items = _collect_recipe_items_for_entry(session, entry, entry_deltas, pattern)
    else:
        items = _collect_template_items_for_entry(session, entry, entry_deltas)

    if entry_deltas and entry_deltas.added_items:
        for delta_item in entry_deltas.added_items:
            items.append((delta_item.name, delta_item.menge))

    return items


def _accumulate_fresh_items(
    session,
    items_for_entry: list[tuple[str, str | None]],
    first_store,
    next_main_date_str: str,
    items_to_move: dict[str, str],
) -> None:
    """Filter fresh items present on the main day and accumulate their quantities."""
    for name, menge in items_for_entry:
        if not menge:
            continue
        is_fresh = (
            session.exec(
                select(Product).where(
                    Product.store_id == first_store.id,
                    Product.name == name,
                    Product.fresh == True,  # noqa: E712
                )
            ).first()
            is not None
        )
        if not is_fresh:
            continue
        if not _find_item_by_match_strategy(
            session, name, next_main_date_str, first_store.id
        ):
            continue
        if name in items_to_move:
            merged = merge_quantities(items_to_move[name], menge)
            if merged:
                items_to_move[name] = merged
        else:
            items_to_move[name] = menge


def _apply_fresh_items_move(
    session,
    items_to_move: dict[str, str],
    next_main_date_str: str,
    next_fresh_date_str: str,
    first_store,
) -> tuple[list[Item], list[Item]]:
    """Subtract from main shopping day and add each item to the fresh products day."""
    modified_items: list[Item] = []
    deleted_items: list[Item] = []

    for name, menge in items_to_move.items():
        if not menge:
            continue
        main_item = _find_item_by_match_strategy(
            session, name, next_main_date_str, first_store.id
        )
        if not main_item:
            continue
        _subtract_item_quantity(
            main_item, menge, session, modified_items, deleted_items
        )
        _add_or_merge_ingredient_item(
            session, name, menge, next_fresh_date_str, first_store, modified_items
        )
        session.commit()

    return modified_items, deleted_items


async def merge_fresh_day_items_to_main_day():
    """Merge all items scheduled for the fresh products day into the main shopping day.

    Called when single_shopping_day is enabled.
    """
    main_shopping_day = int(os.getenv("MAIN_SHOPPING_DAY", "2"))
    fresh_products_day_num = int(os.getenv("FRESH_PRODUCTS_DAY", "4"))

    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    next_main_date = _get_next_weekday(today, main_shopping_day).date().isoformat()
    next_fresh_date = (
        _get_next_weekday(today, fresh_products_day_num).date().isoformat()
    )

    if next_main_date == next_fresh_date:
        return

    with get_session() as session:
        fresh_items = session.exec(
            select(Item).where(Item.shopping_date == next_fresh_date)
        ).all()

        if not fresh_items:
            return

        operations = [
            (
                fresh_item,
                _find_item_by_match_strategy(
                    session, fresh_item.name, next_main_date, fresh_item.store_id
                ),
            )
            for fresh_item in fresh_items
        ]

        modified_items = []
        deleted_item_ids = []

        for fresh_item, existing_item in operations:
            if existing_item:
                merged_menge = merge_quantities(existing_item.menge, fresh_item.menge)
                if merged_menge and merged_menge.strip():
                    existing_item.menge = merged_menge
                    session.add(existing_item)
                    modified_items.append(existing_item)
                deleted_item_ids.append(fresh_item.id)
                session.delete(fresh_item)
            else:
                fresh_item.shopping_date = next_main_date
                session.add(fresh_item)
                modified_items.append(fresh_item)

        session.commit()

        for item in modified_items:
            session.refresh(item)
            await manager.broadcast(
                {
                    "type": "item:updated",
                    "data": _item_to_broadcast_data(session, item),
                }
            )

        for item_id in deleted_item_ids:
            await manager.broadcast(
                {
                    "type": "item:deleted",
                    "data": {"id": item_id},
                }
            )


async def split_main_day_fresh_items_to_fresh_day():
    """Move fresh product items back from main shopping day to the fresh products day.

    Called when single_shopping_day is disabled.
    """
    main_shopping_day_num = int(os.getenv("MAIN_SHOPPING_DAY", "2"))
    fresh_products_day_num = int(os.getenv("FRESH_PRODUCTS_DAY", "4"))

    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    next_main_date = _get_next_weekday(today, main_shopping_day_num).date()
    next_fresh_date = _get_next_weekday(today, fresh_products_day_num).date()

    if next_main_date == next_fresh_date:
        return

    with get_session() as session:
        first_store = session.exec(
            select(Store).order_by(Store.sort_order, Store.id)
        ).first()
        if not first_store:
            return

        next_fresh_date_str = next_fresh_date.isoformat()
        next_main_date_str = next_main_date.isoformat()

        entries = session.exec(
            select(WeekplanEntry).where(WeekplanEntry.date >= next_fresh_date_str)
        ).all()

        qualifying_entries = [
            e
            for e in entries
            if e.date > next_fresh_date_str
            or (e.date == next_fresh_date_str and e.meal == "dinner")
        ]

        if not qualifying_entries:
            return

        pattern = _create_ingredient_pattern(session)
        items_to_move: dict[str, str] = {}

        for entry in qualifying_entries:
            items_for_entry = _collect_entry_items_for_fresh_split(
                session, entry, pattern
            )
            _accumulate_fresh_items(
                session, items_for_entry, first_store, next_main_date_str, items_to_move
            )

        if not items_to_move:
            return

        modified_items, deleted_items = _apply_fresh_items_move(
            session, items_to_move, next_main_date_str, next_fresh_date_str, first_store
        )

        for item in modified_items:
            session.refresh(item)
            await manager.broadcast(
                {
                    "type": "item:updated",
                    "data": _item_to_broadcast_data(session, item),
                }
            )

        for item in deleted_items:
            await manager.broadcast(
                {
                    "type": "item:deleted",
                    "data": {"id": item.id},
                }
            )
