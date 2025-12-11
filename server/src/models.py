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
        person_count: Number of persons this template is designed for (default: 2)
    """

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True)
    description: Optional[str] = None
    person_count: int = Field(default=2)

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


class WeekplanEntry(SQLModel, table=True):
    """Weekly meal plan entry (shared across all users).

    Attributes:
        id: Primary key (auto-generated integer)
        date: Date in ISO format (YYYY-MM-DD)
        meal: Meal type ('morning', 'lunch', 'dinner')
        text: Entry text content
        recipe_id: Optional recipe ID reference
        deltas: JSON field storing item modifications
                (removed items, added items, person count)
                Format: {
                    "removed_items": ["item_name1", "item_name2"],
                    "added_items": [{"name": "item", "menge": "2 kg"}],
                    "person_count": 4
                }
    """

    id: Optional[int] = Field(default=None, primary_key=True)
    date: str = Field(index=True)  # ISO format: YYYY-MM-DD
    meal: str = Field(index=True)  # 'morning', 'lunch', 'dinner'
    text: str
    recipe_id: Optional[int] = Field(default=None)  # Optional recipe reference
    deltas: Optional[str] = Field(default=None)  # JSON string


class WebDAVSettings(SQLModel, table=True):
    """WebDAV configuration for recipe import.

    Attributes:
        id: Primary key (auto-generated integer)
        url: WebDAV server URL
        username: WebDAV username for authentication
        password: WebDAV password (stored encrypted/hashed in production)
        filename: Name of the recipe file on the WebDAV server
        enabled: Whether this configuration is active
    """

    id: Optional[int] = Field(default=None, primary_key=True)
    url: str
    username: str
    password: str
    filename: str
    enabled: bool = Field(default=True)


class Recipe(SQLModel, table=True):
    """Recipe imported from WebDAV.

    Attributes:
        id: Primary key (auto-generated integer)
        external_id: Original ID from the imported data
        name: Recipe name
        data: Complete recipe data as JSON string
        category: Recipe category (optional)
        tags: Recipe tags as JSON array string (optional)
        imported_at: Timestamp when recipe was imported
    """

    id: Optional[int] = Field(default=None, primary_key=True)
    external_id: Optional[str] = Field(default=None, index=True)
    name: str = Field(index=True)
    data: str  # JSON string with complete recipe data
    category: Optional[str] = None
    tags: Optional[str] = None  # JSON array string
    imported_at: Optional[str] = None  # ISO format timestamp


class Unit(SQLModel, table=True):
    """Measurement unit for ingredient parsing.

    Attributes:
        id: Primary key (auto-generated integer)
        name: Unit name/abbreviation (e.g., "kg", "g", "EL", "Prise")
        sort_order: Display order (lower values appear first)
    """

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True)
    sort_order: int = Field(default=0)
