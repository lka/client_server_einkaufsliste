"""Request and response schemas for the Einkaufsliste API."""

from typing import Optional
from pydantic import BaseModel


# Store management schemas
class StoreCreate(BaseModel):
    name: str
    location: str = ""


class StoreUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    sort_order: Optional[int] = None


# Department management schemas
class DepartmentCreate(BaseModel):
    name: str
    sort_order: int = 0


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    sort_order: Optional[int] = None


# Product management schemas
class ProductCreate(BaseModel):
    name: str
    store_id: int
    department_id: int
    fresh: bool = False


class ProductUpdate(BaseModel):
    name: str | None = None
    store_id: int | None = None
    department_id: int | None = None
    fresh: bool | None = None


# Item management schemas
class ConvertItemRequest(BaseModel):
    department_id: int


class ItemWithDepartment(BaseModel):
    """Item response model with department information."""

    id: str
    user_id: int | None
    store_id: int | None
    product_id: int | None
    name: str
    menge: str | None
    shopping_date: str | None = None
    department_id: int | None = None
    department_name: str | None = None
    department_sort_order: int | None = None
