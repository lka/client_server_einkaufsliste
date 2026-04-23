"""Add recipe/template items to shopping list."""

import uuid
from typing import List, Optional
from datetime import datetime
from sqlmodel import select

from ...models import ShoppingTemplate, Store, Item, Recipe
from ..items import _find_item_by_match_strategy, _find_matching_product
from ...utils import merge_quantities
from ._models import WeekplanDeltas
from ._utils import (
    _calculate_shopping_date,
    _adjust_quantity_by_person_count,
    _parse_recipe_data,
    _create_ingredient_pattern,
    _parse_ingredient_line,
    _create_removed_items_set,
)
from ._item_ops import _add_or_merge_ingredient_item


def _add_template_items_to_shopping_list(
    session,
    template_name: str,
    weekplan_date: str,
    meal: str,
    deltas: Optional[WeekplanDeltas] = None,
    single_shopping_day: bool = False,
) -> List[Item]:
    """Add template items to shopping list when weekplan entry matches template name."""
    modified_items = []

    weekplan_datetime = datetime.fromisoformat(weekplan_date)
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    if weekplan_datetime.date() < today.date():
        return modified_items

    template = session.exec(
        select(ShoppingTemplate).where(ShoppingTemplate.name == template_name)
    ).first()

    if not template:
        return modified_items

    first_store = session.exec(
        select(Store).order_by(Store.sort_order, Store.id)
    ).first()

    if not first_store:
        return modified_items

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
            single_shopping_day=single_shopping_day,
        )

        item_menge = template_item.menge
        if person_count is not None:
            item_menge = _adjust_quantity_by_person_count(
                template_item.menge, person_count, template.person_count
            )

        existing_item = _find_item_by_match_strategy(
            session, template_item.name, shopping_date, first_store.id
        )

        if existing_item:
            merged_menge = merge_quantities(existing_item.menge, item_menge)
            if merged_menge is None or merged_menge.strip() == "":
                session.delete(existing_item)
            else:
                existing_item.menge = merged_menge
                session.add(existing_item)
                modified_items.append(existing_item)
        else:
            new_item = Item(
                id=str(uuid.uuid4()),
                name=template_item.name,
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

    if deltas and deltas.added_items:
        for delta_item in deltas.added_items:
            shopping_date = _calculate_shopping_date(
                weekplan_date,
                delta_item.name,
                first_store,
                session,
                meal,
                single_shopping_day=single_shopping_day,
            )

            existing_item = _find_item_by_match_strategy(
                session, delta_item.name, shopping_date, first_store.id
            )

            if existing_item:
                merged_menge = merge_quantities(existing_item.menge, delta_item.menge)
                if merged_menge is None or merged_menge.strip() == "":
                    session.delete(existing_item)
                else:
                    existing_item.menge = merged_menge
                    session.add(existing_item)
                    modified_items.append(existing_item)
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

    return modified_items


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
    single_shopping_day: bool = False,
) -> None:
    """Process recipe ingredients and add them to shopping list."""
    for line in ingredient_lines:
        quantity_str, name = _parse_ingredient_line(line, pattern)

        if name in removed_items:
            continue

        item_menge = quantity_str if quantity_str else "1"
        if person_count is not None and quantity_str:
            item_menge = _adjust_quantity_by_person_count(
                quantity_str, person_count, original_quantity
            )

        shopping_date = _calculate_shopping_date(
            weekplan_date,
            name,
            first_store,
            session,
            meal,
            single_shopping_day=single_shopping_day,
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
    single_shopping_day: bool = False,
) -> None:
    """Process delta added items and add them to shopping list."""
    for delta_item in delta_items:
        shopping_date = _calculate_shopping_date(
            weekplan_date,
            delta_item.name,
            first_store,
            session,
            meal,
            single_shopping_day=single_shopping_day,
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
    single_shopping_day: bool = False,
) -> List[Item]:
    """Add recipe ingredients to shopping list."""
    modified_items = []

    weekplan_datetime = datetime.fromisoformat(weekplan_date)
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    if weekplan_datetime.date() < today.date():
        return modified_items

    recipe = session.get(Recipe, recipe_id)
    if not recipe:
        return modified_items

    ingredients_text, original_quantity, ingredient_lines = _parse_recipe_data(recipe)
    if not ingredients_text:
        return modified_items

    first_store = session.exec(
        select(Store).order_by(Store.sort_order, Store.id)
    ).first()

    if not first_store:
        return modified_items

    person_count = deltas.person_count if deltas else None
    pattern = _create_ingredient_pattern(session)
    removed_items = (
        _create_removed_items_set(deltas.removed_items, pattern) if deltas else set()
    )

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
        single_shopping_day=single_shopping_day,
    )

    session.commit()

    if deltas and deltas.added_items:
        _process_delta_items(
            session,
            deltas.added_items,
            weekplan_date,
            first_store,
            meal,
            modified_items,
            single_shopping_day=single_shopping_day,
        )
        session.commit()

    return modified_items
