"""Remove recipe/template items from shopping list."""

from typing import List, Optional
from datetime import datetime
from sqlmodel import select

from ...models import ShoppingTemplate, Store, Item, Recipe
from ..items import _find_item_by_match_strategy
from ._models import WeekplanDeltas
from ._utils import (
    _calculate_shopping_date,
    _adjust_quantity_by_person_count,
    _parse_recipe_data,
    _create_ingredient_pattern,
    _parse_ingredient_line,
    _create_removed_items_set,
)
from ._item_ops import _subtract_item_quantity


def _subtract_ingredient_item(
    session,
    name: str,
    menge: str,
    shopping_date: str,
    store: Store,
    modified_items: List[Item],
    deleted_items: List[Item],
) -> None:
    """Subtract quantity from existing item in shopping list."""
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
    single_shopping_day: bool = False,
) -> None:
    """Process recipe ingredients and remove them from shopping list."""
    for line in ingredient_lines:
        quantity_str, name = _parse_ingredient_line(line, pattern)

        if name in removed_items:
            continue

        shopping_date = _calculate_shopping_date(
            weekplan_date, name, first_store, session, meal, single_shopping_day
        )

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
    single_shopping_day: bool = False,
) -> None:
    """Process delta items and remove them from shopping list."""
    for delta_item in delta_items:
        shopping_date = _calculate_shopping_date(
            weekplan_date,
            delta_item.name,
            first_store,
            session,
            meal,
            single_shopping_day,
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
    single_shopping_day: bool = False,
) -> tuple[List[Item], List[Item]]:
    """Remove recipe items from shopping list when weekplan entry is deleted."""
    modified_items = []
    deleted_items = []

    weekplan_datetime = datetime.fromisoformat(weekplan_date)
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    if weekplan_datetime.date() < today.date():
        return modified_items, deleted_items

    recipe = session.get(Recipe, recipe_id)
    if not recipe:
        return modified_items, deleted_items

    ingredients_text, original_quantity, ingredient_lines = _parse_recipe_data(recipe)
    if not ingredients_text:
        return modified_items, deleted_items

    first_store = session.exec(
        select(Store).order_by(Store.sort_order, Store.id)
    ).first()

    if not first_store:
        return modified_items, deleted_items

    person_count = deltas.person_count if deltas else None
    pattern = _create_ingredient_pattern(session)
    removed_items = (
        _create_removed_items_set(deltas.removed_items, pattern) if deltas else set()
    )

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
        single_shopping_day,
    )

    if deltas and deltas.added_items:
        _process_delta_items_removal(
            session,
            deltas.added_items,
            weekplan_date,
            first_store,
            meal,
            modified_items,
            deleted_items,
            single_shopping_day,
        )

    return modified_items, deleted_items


def _remove_template_items_from_shopping_list(
    session,
    template_name: str,
    weekplan_date: str,
    meal: str,
    deltas: Optional[WeekplanDeltas] = None,
    single_shopping_day: bool = False,
) -> tuple[List[Item], List[Item]]:
    """Remove template items from shopping list when weekplan entry is deleted."""
    modified_items = []
    deleted_items = []

    weekplan_datetime = datetime.fromisoformat(weekplan_date)
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    if weekplan_datetime.date() < today.date():
        return modified_items, deleted_items

    template = session.exec(
        select(ShoppingTemplate).where(ShoppingTemplate.name == template_name)
    ).first()

    if not template:
        return modified_items, deleted_items

    first_store = session.exec(
        select(Store).order_by(Store.sort_order, Store.id)
    ).first()

    if not first_store:
        return modified_items, deleted_items

    removed_items = set(deltas.removed_items) if deltas else set()
    person_count = deltas.person_count if deltas else None

    for template_item in template.template_items:
        if template_item.name in removed_items:
            continue
        shopping_date = _calculate_shopping_date(
            weekplan_date,
            template_item.name,
            first_store,
            session,
            meal,
            single_shopping_day,
        )

        item_menge = template_item.menge
        if person_count is not None:
            item_menge = _adjust_quantity_by_person_count(
                template_item.menge, person_count, template.person_count
            )

        existing_item = _find_item_by_match_strategy(
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

    if deltas and deltas.added_items:
        for delta_item in deltas.added_items:
            shopping_date = _calculate_shopping_date(
                weekplan_date,
                delta_item.name,
                first_store,
                session,
                meal,
                single_shopping_day,
            )

            existing_item = _find_item_by_match_strategy(
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
