"""Store and department management endpoints."""

from typing import List
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import select

from ..models import Store, Department
from ..db import get_session
from ..auth import get_current_user
from ..schemas import StoreCreate, StoreUpdate, DepartmentCreate, DepartmentUpdate

router = APIRouter(prefix="/api/stores", tags=["stores"])


@router.get("", response_model=List[Store])
def get_stores(current_user: str = Depends(get_current_user)):
    """Get all stores ordered by sort_order (requires authentication).

    Args:
        current_user: Current authenticated username from JWT

    Returns:
        List[Store]: All stores in the database ordered by sort_order
    """
    with get_session() as session:
        stores = session.exec(select(Store).order_by(Store.sort_order, Store.id)).all()
        return stores


@router.get("/{store_id}/departments", response_model=List[Department])
def get_store_departments(store_id: int, current_user: str = Depends(get_current_user)):
    """Get all departments for a specific store (requires authentication).

    Args:
        store_id: Store ID
        current_user: Current authenticated username from JWT

    Returns:
        List[Department]: All departments in the store

    Raises:
        HTTPException: If store not found
    """
    with get_session() as session:
        store = session.get(Store, store_id)
        if not store:
            raise HTTPException(status_code=404, detail="Store not found")

        departments = session.exec(
            select(Department)
            .where(Department.store_id == store_id)
            .order_by(Department.sort_order)
        ).all()
        return departments


@router.post("", response_model=Store, status_code=201)
def create_store(
    store_data: StoreCreate, current_user: str = Depends(get_current_user)
):
    """Create a new store (requires authentication).

    Args:
        store_data: Store creation data
        current_user: Current authenticated username from JWT

    Returns:
        Store: The created store

    Raises:
        HTTPException: If store with same name already exists
    """
    with get_session() as session:
        # Check if store already exists
        existing = session.exec(
            select(Store).where(Store.name == store_data.name)
        ).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Store with name '{store_data.name}' already exists",
            )

        store = Store(name=store_data.name, location=store_data.location)
        session.add(store)
        session.commit()
        session.refresh(store)
        return store


@router.put("/{store_id}", response_model=Store)
def update_store(
    store_id: int,
    store_data: StoreUpdate,
    current_user: str = Depends(get_current_user),
):
    """Update a store (requires authentication).

    Args:
        store_id: Store ID
        store_data: Store update data
        current_user: Current authenticated username from JWT

    Returns:
        Store: The updated store

    Raises:
        HTTPException: If store not found
    """
    with get_session() as session:
        store = session.get(Store, store_id)
        if not store:
            raise HTTPException(status_code=404, detail="Store not found")

        # Update only provided fields
        if store_data.name is not None:
            store.name = store_data.name
        if store_data.location is not None:
            store.location = store_data.location
        if store_data.sort_order is not None:
            store.sort_order = store_data.sort_order

        session.add(store)
        session.commit()
        session.refresh(store)
        return store


@router.delete("/{store_id}", status_code=204)
def delete_store(store_id: int, current_user: str = Depends(get_current_user)):
    """Delete a store and all its departments and products (requires authentication).

    Args:
        store_id: Store ID
        current_user: Current authenticated username from JWT

    Raises:
        HTTPException: If store not found
    """
    from ..models import Product

    with get_session() as session:
        store = session.get(Store, store_id)
        if not store:
            raise HTTPException(status_code=404, detail="Store not found")

        # Delete all products for this store
        products = session.exec(
            select(Product).where(Product.store_id == store_id)
        ).all()
        for product in products:
            session.delete(product)

        # Delete all departments for this store
        departments = session.exec(
            select(Department).where(Department.store_id == store_id)
        ).all()
        for dept in departments:
            session.delete(dept)

        # Delete the store
        session.delete(store)
        session.commit()
        return None


@router.post("/{store_id}/departments", response_model=Department, status_code=201)
def create_department(
    store_id: int,
    dept_data: DepartmentCreate,
    current_user: str = Depends(get_current_user),
):
    """Create a new department for a store (requires authentication).

    Args:
        store_id: Store ID
        dept_data: Department creation data
        current_user: Current authenticated username from JWT

    Returns:
        Department: The created department

    Raises:
        HTTPException: If store not found
    """
    with get_session() as session:
        store = session.get(Store, store_id)
        if not store:
            raise HTTPException(status_code=404, detail="Store not found")

        department = Department(
            name=dept_data.name, store_id=store_id, sort_order=dept_data.sort_order
        )
        session.add(department)
        session.commit()
        session.refresh(department)
        return department


# Department endpoints that don't need store_id in path
departments_router = APIRouter(prefix="/api/departments", tags=["departments"])


@departments_router.delete("/{department_id}", status_code=204)
def delete_department(
    department_id: int, current_user: str = Depends(get_current_user)
):
    """Delete a department and all its products (requires authentication).

    Args:
        department_id: Department ID
        current_user: Current authenticated username from JWT

    Raises:
        HTTPException: If department not found
    """
    from ..models import Product

    with get_session() as session:
        department = session.get(Department, department_id)
        if not department:
            raise HTTPException(status_code=404, detail="Department not found")

        # Delete all products in this department
        products = session.exec(
            select(Product).where(Product.department_id == department_id)
        ).all()
        for product in products:
            session.delete(product)

        # Delete the department
        session.delete(department)
        session.commit()
        return None


@departments_router.put("/{department_id}", response_model=Department)
def update_department(
    department_id: int,
    dept_data: DepartmentUpdate,
    current_user: str = Depends(get_current_user),
):
    """Update a department (requires authentication).

    Args:
        department_id: Department ID
        dept_data: Department update data (partial update supported)
        current_user: Current authenticated username from JWT

    Returns:
        Department: The updated department

    Raises:
        HTTPException: If department not found
    """
    with get_session() as session:
        department = session.get(Department, department_id)
        if not department:
            raise HTTPException(status_code=404, detail="Department not found")

        # Update only provided fields
        if dept_data.name is not None:
            department.name = dept_data.name
        if dept_data.sort_order is not None:
            department.sort_order = dept_data.sort_order

        session.add(department)
        session.commit()
        session.refresh(department)
        return department


@departments_router.get("/{department_id}/products", response_model=List)
def get_department_products(
    department_id: int, current_user: str = Depends(get_current_user)
):
    """Get all products in a specific department (requires authentication).

    Args:
        department_id: Department ID
        current_user: Current authenticated username from JWT

    Returns:
        List[Product]: All products in the department

    Raises:
        HTTPException: If department not found
    """
    from ..models import Product

    with get_session() as session:
        department = session.get(Department, department_id)
        if not department:
            raise HTTPException(status_code=404, detail="Department not found")

        products = session.exec(
            select(Product).where(Product.department_id == department_id)
        ).all()
        return products
