"""Product management endpoints."""

from typing import List
from difflib import SequenceMatcher
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import select

from ..models import Store, Department, Product
from ..db import get_session
from ..auth import get_current_user
from ..schemas import ProductCreate, ProductUpdate
from ..utils import normalize_name
from ..websocket_manager import manager

router = APIRouter(prefix="/api", tags=["products"])


@router.get("/stores/{store_id}/products", response_model=List[Product])
def get_store_products(store_id: int, current_user: str = Depends(get_current_user)):
    """Get all products for a specific store (requires authentication).

    Args:
        store_id: Store ID
        current_user: Current authenticated username from JWT

    Returns:
        List[Product]: All products in the store

    Raises:
        HTTPException: If store not found
    """
    with get_session() as session:
        store = session.get(Store, store_id)
        if not store:
            raise HTTPException(status_code=404, detail="Store not found")

        products = session.exec(
            select(Product).where(Product.store_id == store_id)
        ).all()
        return products


def _add_products_to_matches(
    products: List[Product],
    normalized_query: str,
    matches: List[tuple],
):
    """Add products to matches list based on fuzzy matching (Helper function)."""
    for product in products:
        normalized_product = normalize_name(product.name)
        ratio = SequenceMatcher(None, normalized_query, normalized_product).ratio()

        # Boost score if query is at start of product name
        if normalized_product.startswith(normalized_query):
            ratio = min(ratio + 0.3, 1.0)

        if ratio > 0.3:
            matches.append((ratio, product.name, "product"))


def _add_template_items_to_matches(
    template_items: List,
    normalized_query: str,
    matches: List[tuple],
    existing_names: set,
):
    """Add template items to matches list based on fuzzy matching (Helper function)."""
    for item in template_items:
        # Skip if already added from products or templates
        if item.name in [m[1] for m in matches]:
            continue

        # Skip duplicates within template items
        # Skip if already added
        if item.name in existing_names:
            continue

        existing_names.add(item.name)
        normalized_item = normalize_name(item.name)
        ratio = SequenceMatcher(None, normalized_query, normalized_item).ratio()

        # Boost score if query is at start
        if normalized_item.startswith(normalized_query):
            ratio = min(ratio + 0.3, 1.0)

        if ratio > 0.3:
            matches.append((ratio, item.name, "template_item"))


@router.get("/stores/{store_id}/products/suggestions")
def get_product_suggestions(
    store_id: int,
    q: str,
    limit: int = 10,
    current_user: str = Depends(get_current_user),
):
    """Get product suggestions for autocomplete (requires authentication).

    Returns top matching names from products and template items.
    Uses fuzzy matching with normalized names for better results.

    Args:
        store_id: Store ID
        q: Search query string (partial product name)
        limit: Maximum number of suggestions (default: 10)
        current_user: Current authenticated username from JWT

    Returns:
        List[dict]: Top matching suggestions with name and source
            [{"name": "Möhren", "source": "product"}, ...]

    Raises:
        HTTPException: If store not found
    """
    with get_session() as session:
        store = session.get(Store, store_id)
        if not store:
            raise HTTPException(status_code=404, detail="Store not found")

        if not q.strip():
            return []

        normalized_query = normalize_name(q)
        matches = []

        # Get all products for this store
        products = session.exec(
            select(Product).where(Product.store_id == store_id)
        ).all()

        # Add products to matches
        _add_products_to_matches(products, normalized_query, matches)
        # for product in products:
        #     normalized_product = normalize_name(product.name)
        #     ratio = SequenceMatcher(None, normalized_query,
        #                             normalized_product).ratio()

        #     # Boost score if query is at start of product name
        #     if normalized_product.startswith(normalized_query):
        #         ratio = min(ratio + 0.3, 1.0)

        #     if ratio > 0.3:
        #         matches.append((ratio, product.name, "product"))

        # Get all template names (for template suggestions)
        from ..models import ShoppingTemplate, TemplateItem

        templates = session.exec(select(ShoppingTemplate)).all()
        for template in templates:
            # Skip if already added from products
            if template.name in [m[1] for m in matches]:
                continue

            normalized_template = normalize_name(template.name)
            ratio = SequenceMatcher(None, normalized_query, normalized_template).ratio()

            # Boost score if query is at start
            if normalized_template.startswith(normalized_query):
                ratio = min(ratio + 0.3, 1.0)

            if ratio > 0.3:
                matches.append((ratio, template.name, "template"))

        # Get all template items and add unique names
        template_items = session.exec(select(TemplateItem)).all()
        template_item_names = set()  # Track unique template item names

        # Add template items to matches
        _add_template_items_to_matches(
            template_items, normalized_query, matches, template_item_names
        )
        # for item in template_items:
        #     # Skip if already added from products or templates
        #     if item.name in [m[1] for m in matches]:
        #         continue

        #     # Skip duplicates within template items
        #     if item.name in template_item_names:
        #         continue

        #     template_item_names.add(item.name)
        #     normalized_item = normalize_name(item.name)
        #     ratio = SequenceMatcher(None, normalized_query, normalized_item).ratio()

        #     # Boost score if query is at start
        #     if normalized_item.startswith(normalized_query):
        #         ratio = min(ratio + 0.3, 1.0)

        #     if ratio > 0.3:
        #         matches.append((ratio, item.name, "template_item"))

        # Sort by score (descending) and return top N
        matches.sort(key=lambda x: x[0], reverse=True)
        return [{"name": name, "source": source} for _, name, source in matches[:limit]]


@router.get("/stores/{store_id}/products/search")
def search_products_fuzzy(
    store_id: int, q: str, current_user: str = Depends(get_current_user)
):
    """Fuzzy search for products in a specific store (requires authentication).

    Args:
        store_id: Store ID
        q: Search query string
        current_user: Current authenticated username from JWT

    Returns:
        Product or None: Best matching product above threshold (0.6)

    Raises:
        HTTPException: If store not found
    """
    with get_session() as session:
        store = session.get(Store, store_id)
        if not store:
            raise HTTPException(status_code=404, detail="Store not found")

        # Get all products for this store
        products = session.exec(
            select(Product).where(Product.store_id == store_id)
        ).all()

        if not products:
            return None

        # Fuzzy match against all products
        normalized_query = normalize_name(q)
        best_match = None
        best_ratio = 0.0

        for product in products:
            normalized_product = normalize_name(product.name)
            ratio = SequenceMatcher(None, normalized_query, normalized_product).ratio()

            if ratio > best_ratio:
                best_ratio = ratio
                best_match = product

        # Return best match if above threshold
        if best_ratio >= 0.6:
            return best_match

        return None


@router.post("/products", response_model=Product, status_code=201)
async def create_product(
    product_data: ProductCreate, current_user: str = Depends(get_current_user)
):
    """Create a new product (requires authentication).

    After creating the product, automatically updates all existing shopping list items
    in this store that match the product name to use the new product's department.
    Updates are broadcast via WebSocket to all connected clients.

    Args:
        product_data: Product creation data
        current_user: Current authenticated username from JWT

    Returns:
        Product: The created product

    Raises:
        HTTPException: If store or department not found
    """
    with get_session() as session:
        # Verify store exists
        store = session.get(Store, product_data.store_id)
        if not store:
            raise HTTPException(status_code=404, detail="Store not found")

        # Verify department exists and belongs to the store
        department = session.get(Department, product_data.department_id)
        if not department:
            raise HTTPException(status_code=404, detail="Department not found")
        if department.store_id != product_data.store_id:
            raise HTTPException(
                status_code=400,
                detail="Department does not belong to the specified store",
            )

        product = Product(
            name=product_data.name,
            store_id=product_data.store_id,
            department_id=product_data.department_id,
            fresh=product_data.fresh,
            manufacturer=product_data.manufacturer,
        )
        session.add(product)
        session.commit()
        session.refresh(product)

        # Update all existing items in this store with matching name
        from sqlmodel import func
        from ..models import Item

        # Find all items in this store where name matches (case-insensitive)
        statement = select(Item).where(
            Item.store_id == product_data.store_id,
            func.lower(Item.name) == func.lower(product_data.name),
        )
        matching_items = session.exec(statement).all()

        updated_items = []
        for item in matching_items:
            # Update item to reference the new product
            item.product_id = product.id
            item.name = product.name  # Normalize name to product name
            item.manufacturer = product.manufacturer
            session.add(item)
            updated_items.append(item)

        if updated_items:
            session.commit()
            # Refresh all updated items to get latest state
            for item in updated_items:
                session.refresh(item)

            print(
                f"Updated {len(updated_items)} existing items "
                f"to use new product '{product.name}'"
            )

            # Broadcast item updates via WebSocket
            for item in updated_items:
                await manager.broadcast(
                    {
                        "type": "item:update",
                        "data": {
                            "id": item.id,
                            "name": item.name,
                            "product_id": item.product_id,
                            "store_id": item.store_id,
                            "user_id": item.user_id,
                            "menge": item.menge,
                            "shopping_date": item.shopping_date,
                            "manufacturer": item.manufacturer,
                        },
                    }
                )

        return product


@router.put("/products/{product_id}", response_model=Product)
async def update_product(
    product_id: int,
    product_data: ProductUpdate,
    current_user: str = Depends(get_current_user),
):
    """Update a product (requires authentication).

    Args:
        product_id: Product ID
        product_data: Product update data (only provided fields are updated)
        current_user: Current authenticated username from JWT

    Returns:
        Product: The updated product

    Raises:
        HTTPException: If product, store, or department not found
    """
    with get_session() as session:
        product = session.get(Product, product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        # Update fields if provided
        if product_data.name is not None:
            product.name = product_data.name
        if product_data.fresh is not None:
            product.fresh = product_data.fresh
        if product_data.manufacturer is not None:
            product.manufacturer = product_data.manufacturer

        # If store_id is being updated, verify it exists
        if product_data.store_id is not None:
            store = session.get(Store, product_data.store_id)
            if not store:
                raise HTTPException(status_code=404, detail="Store not found")
            product.store_id = product_data.store_id

        # If department_id is being updated, verify it exists and belongs to store
        if product_data.department_id is not None:
            department = session.get(Department, product_data.department_id)
            if not department:
                raise HTTPException(status_code=404, detail="Department not found")
            if department.store_id != product.store_id:
                raise HTTPException(
                    status_code=400,
                    detail="Department does not belong to the product's store",
                )
            product.department_id = product_data.department_id

        session.add(product)
        session.commit()
        session.refresh(product)

        # Update all existing items linked to this product
        from ..models import Item

        statement = select(Item).where(Item.product_id == product_id)
        linked_items = session.exec(statement).all()

        updated_items = []
        for item in linked_items:
            item.manufacturer = product.manufacturer
            session.add(item)
            updated_items.append(item)

        if updated_items:
            session.commit()
            for item in updated_items:
                session.refresh(item)

            # Broadcast item updates via WebSocket
            for item in updated_items:
                await manager.broadcast(
                    {
                        "type": "item:update",
                        "data": {
                            "id": item.id,
                            "name": item.name,
                            "product_id": item.product_id,
                            "store_id": item.store_id,
                            "user_id": item.user_id,
                            "menge": item.menge,
                            "shopping_date": item.shopping_date,
                            "manufacturer": item.manufacturer,
                        },
                    }
                )

        return product


@router.delete("/products/{product_id}", status_code=204)
def delete_product(product_id: int, current_user: str = Depends(get_current_user)):
    """Delete a product (requires authentication).

    Args:
        product_id: Product ID
        current_user: Current authenticated username from JWT

    Raises:
        HTTPException: If product not found
    """
    with get_session() as session:
        product = session.get(Product, product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        session.delete(product)
        session.commit()
        return None
