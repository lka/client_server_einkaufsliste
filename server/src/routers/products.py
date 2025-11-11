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
def create_product(
    product_data: ProductCreate, current_user: str = Depends(get_current_user)
):
    """Create a new product (requires authentication).

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
        )
        session.add(product)
        session.commit()
        session.refresh(product)
        return product


@router.put("/products/{product_id}", response_model=Product)
def update_product(
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
