"""SQL Models for Einkaufsliste (shopping list) application.

This module defines the database schema with support for:
- Stores (Geschäfte): Different shops where items can be purchased
- Departments (Abteilungen): Sections within stores (e.g., produce, dairy)
- Products (Produkte): Master list of products with store and department assignments
- Items: User-specific shopping list entries referencing products
"""

from typing import Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from .user_models import User


class Store(SQLModel, table=True):
    """Store (Geschäft) where shopping can be done.

    Attributes:
        id: Primary key (auto-generated integer)
        name: Store name (e.g., "Rewe", "Edeka", "Aldi")
        location: Optional location/address information
        sort_order: Optional sort order for organizing stores
    """

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True)
    location: Optional[str] = None
    sort_order: Optional[int] = None

    # Relationships
    departments: list["Department"] = Relationship(back_populates="store")
    products: list["Product"] = Relationship(back_populates="store")
    items: list["Item"] = Relationship(back_populates="store")


class Department(SQLModel, table=True):
    """Department (Abteilung) within a store.

    Attributes:
        id: Primary key (auto-generated integer)
        name: Department name (e.g., "Obst & Gemüse", "Milchprodukte")
        store_id: Foreign key to store
        sort_order: Optional sort order for organizing departments
    """

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    store_id: int = Field(foreign_key="store.id", index=True)
    sort_order: Optional[int] = None

    # Relationships
    store: Store = Relationship(back_populates="departments")
    products: list["Product"] = Relationship(back_populates="department")


class Product(SQLModel, table=True):
    """Product (Produkt) master list with store and department assignment.

    Attributes:
        id: Primary key (auto-generated integer)
        name: Product name (e.g., "Milch", "Brot", "Äpfel")
        store_id: Foreign key to store where product is available
        department_id: Foreign key to department where product is located
        fresh: Boolean flag indicating if the product is fresh/perishable
               (default: False)
    """

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    store_id: int = Field(foreign_key="store.id", index=True)
    department_id: int = Field(foreign_key="department.id", index=True)
    fresh: bool = Field(default=False)

    # Relationships
    store: Store = Relationship(back_populates="products")
    department: Department = Relationship(back_populates="products")
    items: list["Item"] = Relationship(back_populates="product")


class Item(SQLModel, table=True):
    """Shopping list item (user-specific).

    Attributes:
        id: Primary key (UUID string for backward compatibility)
        user_id: Foreign key to user who owns this item
        store_id: Optional foreign key to store (for organizing shopping lists by store)
        product_id: Optional foreign key to product (None for free-text items)
        name: Item name (can override product name for display)
        menge: Optional quantity (e.g., "500 g", "2 Stück")
        shopping_date: Optional date when shopping is planned (ISO format: YYYY-MM-DD)
    """

    id: Optional[str] = Field(default=None, primary_key=True)
    user_id: Optional[int] = Field(default=None, foreign_key="user.id", index=True)
    store_id: Optional[int] = Field(default=None, foreign_key="store.id", index=True)
    product_id: Optional[int] = Field(
        default=None, foreign_key="product.id", index=True
    )
    name: str
    menge: Optional[str] = None
    shopping_date: Optional[str] = Field(default=None, index=True)

    # Relationships
    user: Optional["User"] = Relationship(back_populates="items")
    store: Optional[Store] = Relationship(back_populates="items")
    product: Optional[Product] = Relationship(back_populates="items")


class ShoppingTemplate(SQLModel, table=True):
    """Shopping template for recurring shopping lists.

    Attributes:
        id: Primary key (auto-generated integer)
        name: Template name (e.g., "Wochenend-Einkauf", "Backzutaten")
        description: Optional description of the template
    """

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True)
    description: Optional[str] = None

    # Relationships
    template_items: list["TemplateItem"] = Relationship(
        back_populates="template",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )


class TemplateItem(SQLModel, table=True):
    """Item within a shopping template.

    Attributes:
        id: Primary key (auto-generated integer)
        template_id: Foreign key to shopping template
        name: Item name
        menge: Optional quantity specification
    """

    id: Optional[int] = Field(default=None, primary_key=True)
    template_id: int = Field(foreign_key="shoppingtemplate.id", index=True)
    name: str
    menge: Optional[str] = None

    # Relationships
    template: ShoppingTemplate = Relationship(back_populates="template_items")
