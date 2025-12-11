"""Unit management endpoints."""

from typing import List
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlmodel import select

from ..models import Unit
from ..db import get_session
from ..auth import get_current_user
from ..schemas import UnitCreate, UnitUpdate
from ..websocket_manager import manager

router = APIRouter(prefix="/api/units", tags=["units"])


@router.get("", response_model=List[Unit])
def get_units(current_user: str = Depends(get_current_user)):
    """Get all units ordered by sort_order (requires authentication).

    Args:
        current_user: Current authenticated username from JWT

    Returns:
        List[Unit]: All units in the database ordered by sort_order
    """
    with get_session() as session:
        units = session.exec(select(Unit).order_by(Unit.sort_order, Unit.id)).all()
        return units


@router.post("", response_model=Unit, status_code=201)
async def create_unit(
    unit_data: UnitCreate,
    background_tasks: BackgroundTasks,
    current_user: str = Depends(get_current_user),
):
    """Create a new unit (requires authentication).

    Broadcasts unit:created event to all connected WebSocket clients.

    Args:
        unit_data: Unit creation data
        background_tasks: FastAPI background tasks
        current_user: Current authenticated username from JWT

    Returns:
        Unit: The created unit

    Raises:
        HTTPException: If unit with same name already exists
    """
    with get_session() as session:
        # Check if unit already exists
        existing = session.exec(select(Unit).where(Unit.name == unit_data.name)).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Unit with name '{unit_data.name}' already exists",
            )

        unit = Unit(name=unit_data.name, sort_order=unit_data.sort_order)
        session.add(unit)
        session.commit()
        session.refresh(unit)

        # Broadcast unit created to all WebSocket clients
        await manager.broadcast(
            {
                "type": "unit:created",
                "data": {
                    "id": unit.id,
                    "name": unit.name,
                    "sort_order": unit.sort_order,
                },
            }
        )

        return unit


@router.put("/{unit_id}", response_model=Unit)
async def update_unit(
    unit_id: int,
    unit_data: UnitUpdate,
    background_tasks: BackgroundTasks,
    current_user: str = Depends(get_current_user),
):
    """Update a unit (requires authentication).

    Broadcasts unit:updated event to all connected WebSocket clients.

    Args:
        unit_id: Unit ID
        unit_data: Unit update data
        background_tasks: FastAPI background tasks
        current_user: Current authenticated username from JWT

    Returns:
        Unit: The updated unit

    Raises:
        HTTPException: If unit not found
    """
    with get_session() as session:
        unit = session.get(Unit, unit_id)
        if not unit:
            raise HTTPException(status_code=404, detail="Unit not found")

        # Update only provided fields
        if unit_data.name is not None:
            # Check if name already exists for another unit
            existing = session.exec(
                select(Unit).where(Unit.name == unit_data.name, Unit.id != unit_id)
            ).first()
            if existing:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unit with name '{unit_data.name}' already exists",
                )
            unit.name = unit_data.name
        if unit_data.sort_order is not None:
            unit.sort_order = unit_data.sort_order

        session.add(unit)
        session.commit()
        session.refresh(unit)

        # Broadcast unit updated to all WebSocket clients
        await manager.broadcast(
            {
                "type": "unit:updated",
                "data": {
                    "id": unit.id,
                    "name": unit.name,
                    "sort_order": unit.sort_order,
                },
            }
        )

        return unit


@router.delete("/{unit_id}", status_code=204)
async def delete_unit(
    unit_id: int,
    background_tasks: BackgroundTasks,
    current_user: str = Depends(get_current_user),
):
    """Delete a unit (requires authentication).

    Broadcasts unit:deleted event to all connected WebSocket clients.

    Args:
        unit_id: Unit ID
        background_tasks: FastAPI background tasks
        current_user: Current authenticated username from JWT

    Raises:
        HTTPException: If unit not found
    """
    with get_session() as session:
        unit = session.get(Unit, unit_id)
        if not unit:
            raise HTTPException(status_code=404, detail="Unit not found")

        # Store unit data before deletion
        unit_data = {
            "id": unit.id,
            "name": unit.name,
            "sort_order": unit.sort_order,
        }

        # Delete the unit
        session.delete(unit)
        session.commit()

        # Broadcast unit deleted to all WebSocket clients
        await manager.broadcast(
            {
                "type": "unit:deleted",
                "data": unit_data,
            }
        )

        return None
