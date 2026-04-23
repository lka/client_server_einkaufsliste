"""Pydantic models for weekplan endpoints."""

from typing import List, Optional
from pydantic import BaseModel


class DeltaItem(BaseModel):
    """Schema for a delta item."""

    name: str
    menge: Optional[str] = None


class WeekplanDeltas(BaseModel):
    """Schema for weekplan entry deltas."""

    removed_items: List[str] = []
    added_items: List[DeltaItem] = []
    person_count: Optional[int] = None


class WeekplanEntryCreate(BaseModel):
    """Schema for creating a weekplan entry."""

    date: str  # ISO format: YYYY-MM-DD
    meal: str  # 'morning', 'lunch', 'dinner'
    text: str
    entry_type: Optional[str] = "text"  # 'text', 'template', or 'recipe'
    recipe_id: Optional[int] = None
    template_id: Optional[int] = None
    deltas: Optional[WeekplanDeltas] = None
    single_shopping_day: bool = False  # If True, all items go to MAIN_SHOPPING_DAY only


class WeekplanEntryResponse(BaseModel):
    """Schema for weekplan entry response."""

    id: int
    date: str
    meal: str
    text: str
    entry_type: Optional[str] = "text"  # 'text', 'template', or 'recipe'
    recipe_id: Optional[int] = None
    template_id: Optional[int] = None
    deltas: Optional[WeekplanDeltas] = None
