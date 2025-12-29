"""Shopping list items endpoints.

This module provides endpoints for managing a shared shopping list.
All items are shared among all authenticated users - there is no per-user
ownership of items. Any authenticated user can:
- View all items in the shared list
- Add new items or update quantities of existing items
- Delete items from the shared list
- Convert items to products and assign departments
- Delete all items for a specific store

Items are automatically matched to products in the store catalog using
fuzzy matching, and similar item names are merged (e.g., "Möhre" merges with "Möhren").
"""

import uuid
from typing import List
from difflib import SequenceMatcher
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlmodel import select
from ..websocket_manager import manager

from ..models import Item, Product, Department
from ..user_models import User
from ..db import get_session
from ..auth import get_current_user
from ..schemas import ItemWithDepartment, ConvertItemRequest
from ..utils import find_similar_item, merge_quantities, normalize_name

router = APIRouter(prefix="/api/items", tags=["items"])


@router.get("", response_model=List[ItemWithDepartment])
def read_items(current_user: str = Depends(get_current_user)):
    """Read all items from the shared shopping list (requires authentication).

    Returns all items from the shared shopping list with department information
    for grouping by department. This is a shared list - all authenticated users
    see the same items regardless of who added them.

    Args:
        current_user: Current authenticated username from JWT

    Returns:
        List[ItemWithDepartment]: All items from the shared list with department info.
    """
    with get_session() as session:
        # Get user to verify authentication
        user = session.exec(select(User).where(User.username == current_user)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Get all items (shared list)
        items = session.exec(select(Item)).all()

        # Enrich items with department information
        items_with_dept = []
        for item in items:
            dept_id = None
            dept_name = None
            dept_sort_order = None
            manufacturer = None

            # If item has a product, get department from product
            if item.product_id:
                product = session.get(Product, item.product_id)
                if product:
                    dept_id = product.department_id
                    manufacturer = product.manufacturer
                    department = session.get(Department, product.department_id)
                    if department:
                        dept_name = department.name
                        dept_sort_order = department.sort_order

            items_with_dept.append(
                ItemWithDepartment(
                    id=item.id,
                    user_id=item.user_id,
                    store_id=item.store_id,
                    product_id=item.product_id,
                    name=item.name,
                    menge=item.menge,
                    shopping_date=item.shopping_date,
                    department_id=dept_id,
                    department_name=dept_name,
                    department_sort_order=dept_sort_order,
                    manufacturer=manufacturer,
                )
            )

        return items_with_dept


@router.get("/by-date", response_model=List[ItemWithDepartment])
def read_items_by_date(
    shopping_date: str = Query(..., description="Shopping date (YYYY-MM-DD)"),
    current_user: str = Depends(get_current_user),
):
    """Read all items for a specific shopping date across all stores.

    Returns all items with the specified shopping date, grouped by store,
    with department information for proper sorting.

    Args:
        shopping_date: Date in YYYY-MM-DD format
        current_user: Current authenticated username from JWT

    Returns:
        List[ItemWithDepartment]: Items with the specified shopping date
    """
    with get_session() as session:
        # Get user to verify authentication
        user = session.exec(select(User).where(User.username == current_user)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Get items for the specified date
        items = session.exec(
            select(Item).where(Item.shopping_date == shopping_date)
        ).all()

        # Enrich items with department information
        items_with_dept = []
        for item in items:
            dept_id = None
            dept_name = None
            dept_sort_order = None
            manufacturer = None

            # If item has a product, get department from product
            if item.product_id:
                product = session.get(Product, item.product_id)
                if product:
                    dept_id = product.department_id
                    manufacturer = product.manufacturer
                    department = session.get(Department, product.department_id)
                    if department:
                        dept_name = department.name
                        dept_sort_order = department.sort_order

            items_with_dept.append(
                ItemWithDepartment(
                    id=item.id,
                    user_id=item.user_id,
                    store_id=item.store_id,
                    product_id=item.product_id,
                    name=item.name,
                    menge=item.menge,
                    shopping_date=item.shopping_date,
                    department_id=dept_id,
                    department_name=dept_name,
                    department_sort_order=dept_sort_order,
                    manufacturer=manufacturer,
                )
            )

        return items_with_dept


def _find_exact_product_match(session, item_name: str, store_id: int | None) -> bool:
    """Check if item name exists exactly in the product list.

    Args:
        session: Database session
        item_name: Name to search for
        store_id: Optional store ID to filter products

    Returns:
        True if an exact match exists in the product list, False otherwise
    """
    from sqlmodel import func

    query = select(Product).where(func.lower(Product.name) == func.lower(item_name))
    if store_id is not None:
        query = query.where(Product.store_id == store_id)

    return session.exec(query).first() is not None


def _find_existing_item_exact(
    session, item_name: str, shopping_date: str | None, store_id: int | None
) -> Item | None:
    """Find existing item with exact match only (no fuzzy matching).

    This is used for recipe ingredients to avoid merging similar but different
    ingredients like 'Kürbiskerne' and 'Kürbiskernöl'.
    """
    from sqlmodel import func

    query = select(Item).where(
        func.lower(Item.name) == func.lower(item_name),
        Item.shopping_date == shopping_date,
    )
    if store_id is not None:
        query = query.where(Item.store_id == store_id)

    return session.exec(query).first()


def _find_existing_item(
    session, item_name: str, shopping_date: str | None, store_id: int | None
) -> Item | None:
    """Find existing item with exact or fuzzy match."""

    # Try exact match first (case-insensitive)
    existing_item = _find_existing_item_exact(
        session, item_name, shopping_date, store_id
    )

    # If no exact match, try fuzzy matching
    if not existing_item:
        existing_item = find_similar_item(
            session,
            item_name,
            None,
            threshold=0.8,
            shopping_date=shopping_date,
            store_id=store_id,
        )

    return existing_item


async def _handle_item_merge(session, existing_item: Item, new_menge: str | None):
    """Merge quantities and broadcast changes."""
    merged_menge = merge_quantities(existing_item.menge, new_menge)

    # Check if item should be deleted (quantity <= 0)
    if merged_menge is None or merged_menge.strip() == "":
        item_id = existing_item.id
        session.delete(existing_item)
        session.commit()

        # Broadcast deletion
        await manager.broadcast({"type": "item:deleted", "data": {"id": item_id}})

        # Return item with None menge to indicate deletion
        existing_item.menge = None
        return existing_item

    # Update existing item
    existing_item.menge = merged_menge
    session.add(existing_item)
    session.commit()
    session.refresh(existing_item)

    # Broadcast update
    await manager.broadcast(
        {
            "type": "item:updated",
            "data": {
                "id": existing_item.id,
                "name": existing_item.name,
                "menge": existing_item.menge,
                "store_id": existing_item.store_id,
                "product_id": existing_item.product_id,
                "shopping_date": existing_item.shopping_date,
                "user_id": existing_item.user_id,
            },
        }
    )

    return existing_item


def _create_negative_quantity_dummy(item: Item) -> ItemWithDepartment:
    """Create dummy item for negative quantity on non-existent item."""
    dummy_item = Item(
        id=str(uuid.uuid4()),
        name=item.name,
        menge=None,
        user_id=None,
        store_id=item.store_id,
        shopping_date=item.shopping_date,
    )

    return ItemWithDepartment(
        id=dummy_item.id,
        user_id=dummy_item.user_id,
        store_id=dummy_item.store_id,
        product_id=None,
        name=dummy_item.name,
        menge=dummy_item.menge,
        shopping_date=dummy_item.shopping_date,
        department_id=None,
        department_name=None,
        department_sort_order=None,
        manufacturer=None,
    )


def _find_matching_product(session, item: Item) -> int | None:
    """Find matching product using fuzzy matching."""
    if not item.store_id or item.product_id:
        return item.product_id

    # Get all products for this store
    products = session.exec(
        select(Product).where(Product.store_id == item.store_id)
    ).all()

    if not products:
        return None

    # Fuzzy match against all products
    normalized_query = normalize_name(item.name)
    best_match = None
    best_ratio = 0.0

    for product in products:
        normalized_product = normalize_name(product.name)
        ratio = SequenceMatcher(None, normalized_query, normalized_product).ratio()

        if ratio > best_ratio:
            best_ratio = ratio
            best_match = product

    # Assign product if match is good enough (threshold 0.6)
    if best_ratio >= 0.6 and best_match:
        item.manufacturer = best_match.manufacturer
        return best_match.id

    return None


def _enrich_with_department(session, result_item: Item) -> ItemWithDepartment:
    """Enrich item with department information."""
    dept_id = None
    dept_name = None
    dept_sort_order = None
    manufacturer = None

    if result_item.product_id:
        product = session.get(Product, result_item.product_id)
        if product:
            dept_id = product.department_id
            manufacturer = product.manufacturer
            department = session.get(Department, product.department_id)
            if department:
                dept_name = department.name
                dept_sort_order = department.sort_order

    return ItemWithDepartment(
        id=result_item.id,
        user_id=result_item.user_id,
        store_id=result_item.store_id,
        product_id=result_item.product_id,
        name=result_item.name,
        menge=result_item.menge,
        shopping_date=result_item.shopping_date,
        department_id=dept_id,
        department_name=dept_name,
        department_sort_order=dept_sort_order,
        manufacturer=manufacturer,
    )


@router.post("", status_code=201, response_model=ItemWithDepartment)
async def create_item(item: Item, current_user: str = Depends(get_current_user)):
    """Create a new item or update quantity if item already exists in the shared list.

    Adds items to the shared shopping list that all authenticated users can access.
    Uses fuzzy matching to find similar item names (e.g., "Möhre" matches "Möhren").
    Automatically matches items to products in the store's catalog using fuzzy matching.

    If an item with the same or similar name AND same shopping_date already exists:
    - If the new unit matches an existing unit in the list, they are summed
    - If the new unit is different, it is appended to the comma-separated list

    Items with different shopping dates are kept separate, even if they
    have the same name. This allows tracking the same item for different
    shopping trips.

    Examples with same shopping_date:
    - "Möhren 500 g" + "300 g" = "Möhren 800 g"
    - "Möhre 300 g" → merges with existing "Möhren" (fuzzy match)
    - "Zucker 500 g" + "2 Packungen" = "Zucker 500 g, 2 Packungen"

    Examples with different shopping_date:
    - "Möhren 500 g" (2024-01-15) + "Möhren 300 g" (2024-01-17) = Two separate items

    Note: Items are created with user_id=None as they belong to the shared list,
    not to individual users.

    Args:
        item (Item): Item payload to create. The id will be autogenerated
            if not provided. The user_id will be set to None.
        current_user: Current authenticated username from JWT

    Returns:
        ItemWithDepartment: The created or updated item with department information.
    """
    with get_session() as session:
        # Verify authentication
        user = session.exec(select(User).where(User.username == current_user)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Find existing item with exact or fuzzy match
        existing_item = _find_existing_item(
            session, item.name, item.shopping_date, item.store_id
        )

        # Handle existing item: merge quantities
        if existing_item:
            result_item = await _handle_item_merge(session, existing_item, item.menge)
            return _enrich_with_department(session, result_item)

        # Handle negative quantity for non-existent item
        if item.menge:
            from ..utils import parse_quantity

            parsed_num, _ = parse_quantity(item.menge)
            if parsed_num is not None and parsed_num < 0:
                return _create_negative_quantity_dummy(item)

        # Create new item
        if not item.id:
            item.id = str(uuid.uuid4())
        item.user_id = None  # Shared list

        # Find matching product
        product_id = _find_matching_product(session, item)
        if product_id:
            item.product_id = product_id

        # Save and broadcast
        session.add(item)
        session.commit()
        session.refresh(item)

        await manager.broadcast(
            {
                "type": "item:added",
                "data": {
                    "id": item.id,
                    "name": item.name,
                    "menge": item.menge,
                    "store_id": item.store_id,
                    "product_id": item.product_id,
                    "shopping_date": item.shopping_date,
                    "user_id": item.user_id,
                    "manufacturer": item.manufacturer,
                },
            }
        )

        return _enrich_with_department(session, item)


@router.delete("/{item_id}", status_code=204)
async def delete_item(item_id: str, current_user: str = Depends(get_current_user)):
    """Delete an item by its id from the database (requires authentication).

    All authenticated users can delete items from the shared shopping list.

    Args:
        item_id (str): The id of the item to delete.
        current_user: Current authenticated username from JWT

    Raises:
        HTTPException: If the item does not exist (404).
    """
    with get_session() as session:
        # Verify user is authenticated
        user = session.exec(select(User).where(User.username == current_user)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        item = session.get(Item, item_id)
        if not item:
            raise HTTPException(status_code=404, detail="Not found")
        session.delete(item)
        session.commit()

        # Broadcast deletion via WebSocket
        await manager.broadcast(
            {
                "type": "item:deleted",
                "data": {"id": item_id},
            }
        )

        return None


@router.delete("/by-date/{before_date}")
async def delete_items_before_date(
    before_date: str,
    store_id: int | None = Query(None),
    current_user: str = Depends(get_current_user),
):
    """Delete items with shopping_date before the specified date.

    All authenticated users can delete items from the shared shopping list.

    Args:
        before_date (str): ISO date string (YYYY-MM-DD).
            All items with shopping_date < before_date will be deleted.
        store_id (int | None): Optional store ID to filter items.
            If provided, only items from this store will be deleted.
        current_user: Current authenticated username from JWT

    Returns:
        Number of deleted items
    """
    with get_session() as session:
        # Verify user is authenticated
        user = session.exec(select(User).where(User.username == current_user)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Build query for items before the specified date
        conditions = [Item.shopping_date.is_not(None), Item.shopping_date < before_date]

        # Add store filter if provided
        if store_id is not None:
            conditions.append(Item.store_id == store_id)

        query = select(Item).where(*conditions)
        items_to_delete = session.exec(query).all()

        count = len(items_to_delete)
        deleted_ids = []
        for item in items_to_delete:
            deleted_ids.append(item.id)
            session.delete(item)

        session.commit()

        # Broadcast deletions via WebSocket
        for item_id in deleted_ids:
            await manager.broadcast(
                {
                    "type": "item:deleted",
                    "data": {"id": item_id},
                }
            )

        return {"deleted_count": count}


@router.post("/{item_id}/convert-to-product", response_model=ItemWithDepartment)
def convert_item_to_product(
    item_id: str,
    request: ConvertItemRequest,
    current_user: str = Depends(get_current_user),
):
    """Convert item to product, update all matching items.

    Creates a new product based on the item name (without quantity),
    assigns it to the specified department, and updates ALL items with
    the same name to reference the new product. This ensures consistent
    department assignment across all shopping dates for items with
    identical names.

    All authenticated users can convert items from the shared shopping list.

    Args:
        item_id: Item ID to convert
        request: Contains department_id to assign the product to
        current_user: Current authenticated username from JWT

    Returns:
        Updated item with department information
    """
    with get_session() as session:
        # Verify user is authenticated
        user = session.exec(select(User).where(User.username == current_user)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Get item
        item = session.get(Item, item_id)
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")

        # Get department and verify it exists
        department = session.get(Department, request.department_id)
        if not department:
            raise HTTPException(status_code=404, detail="Department not found")

        # Extract product name from item (remove quantity info)
        product_name = item.name.strip()

        # Check if product already exists with this name in this store
        existing_product = session.exec(
            select(Product).where(
                Product.name == product_name,
                Product.store_id == department.store_id,
            )
        ).first()

        if existing_product:
            # Use existing product
            product = existing_product
            # Update department if different
            if product.department_id != request.department_id:
                product.department_id = request.department_id
                session.add(product)
        else:
            # Create new product
            product = Product(
                name=product_name,
                store_id=department.store_id,
                department_id=request.department_id,
                fresh=False,
            )
            session.add(product)
            session.flush()  # Get product ID

        # Update ALL items with the same name (regardless of shopping_date)
        # to use the same product_id
        all_matching_items = session.exec(
            select(Item).where(Item.name == item.name)
        ).all()

        for matching_item in all_matching_items:
            matching_item.product_id = product.id
            session.add(matching_item)

        session.commit()
        session.refresh(item)

        # Return item with department info
        dept = session.get(Department, request.department_id)
        return ItemWithDepartment(
            id=str(item.id),
            user_id=item.user_id,
            name=item.name,
            menge=item.menge,
            shopping_date=item.shopping_date,
            store_id=item.store_id,
            product_id=item.product_id,
            department_id=dept.id if dept else None,
            department_name=dept.name if dept else None,
            department_sort_order=dept.sort_order if dept else None,
            manufacturer=None,
        )
