"""SQL Model for Einkaufsliste item."""

from typing import Optional
from sqlmodel import SQLModel, Field


class Item(SQLModel, table=True):
    """SQLModel table representing a shopping-list item.

    Attributes:
        id: Optional[str] - Primary key (UUID string).
        name: str - Human-readable item name.
    """

    id: Optional[str] = Field(default=None, primary_key=True)
    name: str
