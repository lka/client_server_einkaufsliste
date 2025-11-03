"""SQL Model for Einkaufsliste item."""

from typing import Optional
from sqlmodel import SQLModel, Field


class Item(SQLModel, table=True):
    """SQLModel table representing a shopping-list item.

    Attributes:
        id: Optional[str] - Primary key (UUID string).
        name: str - Human-readable item name.
        menge: Optional[str] - Optional quantity (e.g., "500 g", "2 Stück").
    """

    id: Optional[str] = Field(default=None, primary_key=True)
    name: str
    menge: Optional[str] = None
