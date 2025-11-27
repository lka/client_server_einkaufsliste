"""Weekly meal plan endpoints."""

from typing import List
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import select
from pydantic import BaseModel

from ..models import WeekplanEntry
from ..user_models import User
from ..db import get_session
from ..auth import get_current_user

router = APIRouter(prefix="/api/weekplan", tags=["weekplan"])


class WeekplanEntryCreate(BaseModel):
    """Schema for creating a weekplan entry."""

    date: str  # ISO format: YYYY-MM-DD
    meal: str  # 'morning', 'lunch', 'dinner'
    text: str


class WeekplanEntryResponse(BaseModel):
    """Schema for weekplan entry response."""

    id: int
    date: str
    meal: str
    text: str


@router.get("/entries", response_model=List[WeekplanEntryResponse])
def get_weekplan_entries(
    week_start: str,  # ISO format: YYYY-MM-DD (Monday of the week)
    current_user: str = Depends(get_current_user),
):
    """Get all weekplan entries for a specific week (shared across all users).

    Args:
        week_start: Monday of the week in ISO format (YYYY-MM-DD)
        current_user: Current authenticated username from JWT (for authentication only)

    Returns:
        List of weekplan entries for the week
    """
    with get_session() as session:
        # Verify user is authenticated
        user = session.exec(select(User).where(User.username == current_user)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Calculate week dates (7 days from week_start)
        from datetime import datetime, timedelta

        start_date = datetime.fromisoformat(week_start).date()
        end_date = start_date + timedelta(days=6)

        # Query entries for the week (shared across all users)
        statement = select(WeekplanEntry).where(
            WeekplanEntry.date >= week_start, WeekplanEntry.date <= end_date.isoformat()
        )
        entries = session.exec(statement).all()

        return [
            WeekplanEntryResponse(
                id=entry.id, date=entry.date, meal=entry.meal, text=entry.text
            )
            for entry in entries
        ]


@router.post("/entries", response_model=WeekplanEntryResponse)
def create_weekplan_entry(
    entry: WeekplanEntryCreate, current_user: str = Depends(get_current_user)
):
    """Create a new weekplan entry (shared across all users).

    Args:
        entry: Entry data
        current_user: Current authenticated username from JWT (for authentication only)

    Returns:
        Created weekplan entry
    """
    with get_session() as session:
        # Verify user is authenticated
        user = session.exec(select(User).where(User.username == current_user)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Create entry (shared, no user_id)
        db_entry = WeekplanEntry(date=entry.date, meal=entry.meal, text=entry.text)
        session.add(db_entry)
        session.commit()
        session.refresh(db_entry)

        return WeekplanEntryResponse(
            id=db_entry.id, date=db_entry.date, meal=db_entry.meal, text=db_entry.text
        )


@router.delete("/entries/{entry_id}")
def delete_weekplan_entry(entry_id: int, current_user: str = Depends(get_current_user)):
    """Delete a weekplan entry (shared across all users).

    Args:
        entry_id: Entry ID
        current_user: Current authenticated username from JWT (for authentication only)

    Returns:
        Success message
    """
    with get_session() as session:
        # Verify user is authenticated
        user = session.exec(select(User).where(User.username == current_user)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Get entry
        entry = session.get(WeekplanEntry, entry_id)
        if not entry:
            raise HTTPException(status_code=404, detail="Entry not found")

        # Delete entry (no ownership check - shared across all users)
        session.delete(entry)
        session.commit()

        return {"message": "Entry deleted successfully"}
