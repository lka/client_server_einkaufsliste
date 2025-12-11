"""Request and response schemas for the Einkaufsliste API."""

from typing import Optional
from pydantic import BaseModel


# Store management schemas
class StoreCreate(BaseModel):
    """Schema for creating a new store."""

    name: str
    location: str = ""


class StoreUpdate(BaseModel):
    """Schema for updating an existing store."""

    name: Optional[str] = None
    location: Optional[str] = None
    sort_order: Optional[int] = None


# Department management schemas
class DepartmentCreate(BaseModel):
    """Schema for creating a new department."""

    name: str
    sort_order: int = 0


class DepartmentUpdate(BaseModel):
    """Schema for updating an existing department."""

    name: Optional[str] = None
    sort_order: Optional[int] = None


# Product management schemas
class ProductCreate(BaseModel):
    """Schema for creating a new product."""

    name: str
    store_id: int
    department_id: int
    fresh: bool = False


class ProductUpdate(BaseModel):
    """Schema for updating an existing product."""

    name: str | None = None
    store_id: int | None = None
    department_id: int | None = None
    fresh: bool | None = None


# Item management schemas
class ConvertItemRequest(BaseModel):
    """Schema for converting an item to a product."""

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


# WebDAV settings schemas
class WebDAVSettingsCreate(BaseModel):
    """Schema for creating WebDAV settings."""

    url: str
    username: str
    password: str
    filename: str


class WebDAVSettingsUpdate(BaseModel):
    """Schema for updating WebDAV settings."""

    url: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    filename: Optional[str] = None
    enabled: Optional[bool] = None


# Unit management schemas
class UnitCreate(BaseModel):
    """Schema for creating a new unit."""

    name: str
    sort_order: int = 0


class UnitUpdate(BaseModel):
    """Schema for updating an existing unit."""

    name: Optional[str] = None
    sort_order: Optional[int] = None
