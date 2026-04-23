"""Weekplan FastAPI route handlers."""

import json
import logging
from typing import List
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import select

from ...models import WeekplanEntry
from ...user_models import User
from ...db import get_session
from ...auth import get_current_user
from ...websocket_manager import manager
from ... import app_state
from ._models import WeekplanDeltas, WeekplanEntryCreate, WeekplanEntryResponse
from ._utils import _item_to_broadcast_data, _get_known_units
from ._shopping_list_add import (
    _add_recipe_items_to_shopping_list,
    _add_template_items_to_shopping_list,
)
from ._shopping_list_remove import (
    _remove_recipe_items_from_shopping_list,
    _remove_template_items_from_shopping_list,
)
from ._delta_recipe_ops import _update_recipe_deltas
from ._delta_template_ops import _update_template_deltas

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/weekplan", tags=["weekplan"])


@router.get("/known-units", response_model=List[str])
def get_known_units(current_user: str = Depends(get_current_user)):
    """Get list of known measurement units for ingredient parsing."""
    with get_session() as session:
        user = session.exec(select(User).where(User.username == current_user)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return _get_known_units(session)


@router.get("/entries", response_model=List[WeekplanEntryResponse])
def get_weekplan_entries(
    week_start: str,
    current_user: str = Depends(get_current_user),
):
    """Get all weekplan entries for a specific week."""
    with get_session() as session:
        user = session.exec(select(User).where(User.username == current_user)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        from datetime import datetime, timedelta

        start_date = datetime.fromisoformat(week_start).date()
        end_date = start_date + timedelta(days=6)

        statement = select(WeekplanEntry).where(
            WeekplanEntry.date >= week_start, WeekplanEntry.date <= end_date.isoformat()
        )
        entries = session.exec(statement).all()

        return [
            WeekplanEntryResponse(
                id=entry.id,
                date=entry.date,
                meal=entry.meal,
                text=entry.text,
                entry_type=entry.entry_type,
                recipe_id=entry.recipe_id,
                template_id=entry.template_id,
                deltas=(
                    WeekplanDeltas(**json.loads(entry.deltas)) if entry.deltas else None
                ),
            )
            for entry in entries
        ]


@router.post("/entries", response_model=WeekplanEntryResponse)
async def create_weekplan_entry(
    entry: WeekplanEntryCreate, current_user: str = Depends(get_current_user)
):
    """Create a new weekplan entry."""
    with get_session() as session:
        user = session.exec(select(User).where(User.username == current_user)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        deltas_json = None
        if entry.deltas:
            deltas_json = json.dumps(entry.deltas.model_dump())

        db_entry = WeekplanEntry(
            date=entry.date,
            meal=entry.meal,
            text=entry.text,
            entry_type=entry.entry_type or "text",
            recipe_id=entry.recipe_id,
            template_id=entry.template_id,
            deltas=deltas_json,
        )
        session.add(db_entry)
        session.commit()
        session.refresh(db_entry)

        modified_items = []
        if entry.entry_type == "recipe" and entry.recipe_id:
            modified_items = _add_recipe_items_to_shopping_list(
                session,
                entry.recipe_id,
                entry.date,
                entry.meal,
                entry.deltas,
                single_shopping_day=entry.single_shopping_day,
            )
        elif entry.entry_type == "template":
            modified_items = _add_template_items_to_shopping_list(
                session,
                entry.text,
                entry.date,
                entry.meal,
                entry.deltas,
                single_shopping_day=entry.single_shopping_day,
            )
        elif entry.recipe_id:
            modified_items = _add_recipe_items_to_shopping_list(
                session,
                entry.recipe_id,
                entry.date,
                entry.meal,
                entry.deltas,
                single_shopping_day=entry.single_shopping_day,
            )
        else:
            modified_items = _add_template_items_to_shopping_list(
                session,
                entry.text,
                entry.date,
                entry.meal,
                entry.deltas,
                single_shopping_day=entry.single_shopping_day,
            )

        for item in modified_items:
            await manager.broadcast(
                {
                    "type": "item:added",
                    "data": _item_to_broadcast_data(session, item),
                }
            )

        return WeekplanEntryResponse(
            id=db_entry.id,
            date=db_entry.date,
            meal=db_entry.meal,
            text=db_entry.text,
            entry_type=db_entry.entry_type,
            recipe_id=db_entry.recipe_id,
            template_id=db_entry.template_id,
            deltas=entry.deltas,
        )


@router.delete("/entries/{entry_id}")
async def delete_weekplan_entry(
    entry_id: int, current_user: str = Depends(get_current_user)
):
    """Delete a weekplan entry."""
    with get_session() as session:
        user = session.exec(select(User).where(User.username == current_user)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        entry = session.get(WeekplanEntry, entry_id)
        if not entry:
            raise HTTPException(status_code=404, detail="Entry not found")

        entry_deltas = None
        if entry.deltas:
            entry_deltas = WeekplanDeltas(**json.loads(entry.deltas))

        single_shopping_day = app_state.single_shopping_day_enabled
        if entry.entry_type == "recipe" and entry.recipe_id:
            modified_items, deleted_items = _remove_recipe_items_from_shopping_list(
                session,
                entry.recipe_id,
                entry.date,
                entry.meal,
                entry_deltas,
                single_shopping_day,
            )
        elif entry.entry_type == "template":
            modified_items, deleted_items = _remove_template_items_from_shopping_list(
                session,
                entry.text,
                entry.date,
                entry.meal,
                entry_deltas,
                single_shopping_day,
            )
        elif entry.recipe_id:
            modified_items, deleted_items = _remove_recipe_items_from_shopping_list(
                session,
                entry.recipe_id,
                entry.date,
                entry.meal,
                entry_deltas,
                single_shopping_day,
            )
        else:
            modified_items, deleted_items = _remove_template_items_from_shopping_list(
                session,
                entry.text,
                entry.date,
                entry.meal,
                entry_deltas,
                single_shopping_day,
            )

        for item in modified_items:
            await manager.broadcast(
                {
                    "type": "item:updated",
                    "data": _item_to_broadcast_data(session, item),
                }
            )

        for item in deleted_items:
            await manager.broadcast(
                {
                    "type": "item:deleted",
                    "data": {"id": item.id},
                }
            )

        session.delete(entry)
        session.commit()

        return {"message": "Entry deleted successfully"}


@router.patch("/entries/{entry_id}/deltas", response_model=WeekplanEntryResponse)
async def update_weekplan_entry_deltas(
    entry_id: int,
    deltas: WeekplanDeltas,
    current_user: str = Depends(get_current_user),
):
    """Update the deltas for a weekplan entry."""
    with get_session() as session:
        user = session.exec(select(User).where(User.username == current_user)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        entry = session.get(WeekplanEntry, entry_id)
        if not entry:
            raise HTTPException(status_code=404, detail="Weekplan entry not found")

        old_deltas = None
        if entry.deltas:
            old_deltas = WeekplanDeltas(**json.loads(entry.deltas))

        modified_items = []
        deleted_items = []

        if entry.recipe_id:
            _update_recipe_deltas(
                entry, old_deltas, deltas, session, modified_items, deleted_items
            )
        else:
            _update_template_deltas(
                entry, old_deltas, deltas, session, modified_items, deleted_items
            )

        entry.deltas = json.dumps(deltas.model_dump())
        session.add(entry)
        session.commit()
        session.refresh(entry)

        for item in modified_items:
            await manager.broadcast(
                {
                    "type": "item:updated",
                    "data": _item_to_broadcast_data(session, item),
                }
            )

        for item in deleted_items:
            await manager.broadcast(
                {
                    "type": "item:deleted",
                    "data": {"id": item.id},
                }
            )

        await manager.broadcast(
            {
                "type": "weekplan:deltas_updated",
                "data": {
                    "id": entry.id,
                    "date": entry.date,
                    "meal": entry.meal,
                    "text": entry.text,
                    "deltas": deltas.model_dump(),
                },
            }
        )

        return WeekplanEntryResponse(
            id=entry.id,
            date=entry.date,
            meal=entry.meal,
            text=entry.text,
            deltas=deltas,
        )
