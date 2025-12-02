"""Shopping Template Management Router.

This module provides CRUD endpoints for managing shopping templates:
- Templates are reusable shopping lists with predefined items and quantities
- Users can create, read, update, and delete templates
- Each template contains a list of items with optional quantities (menge)
"""

from typing import Optional, Generator
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from pydantic import BaseModel

from ..db import get_engine
from ..models import ShoppingTemplate, TemplateItem
from ..auth import get_current_user


def get_session() -> Generator[Session, None, None]:
    """Dependency for database sessions."""
    engine = get_engine()
    with Session(engine) as session:
        yield session


router = APIRouter(prefix="/api/templates", tags=["templates"])


# Request/Response Models
class TemplateItemCreate(BaseModel):
    """Request model for creating a template item."""

    name: str
    menge: Optional[str] = None


class TemplateItemResponse(BaseModel):
    """Response model for a template item."""

    id: int
    name: str
    menge: Optional[str] = None


class TemplateCreate(BaseModel):
    """Request model for creating a template."""

    name: str
    description: Optional[str] = None
    person_count: int = 2
    items: list[TemplateItemCreate]


class TemplateUpdate(BaseModel):
    """Request model for updating a template."""

    name: Optional[str] = None
    description: Optional[str] = None
    person_count: Optional[int] = None
    items: Optional[list[TemplateItemCreate]] = None


class TemplateResponse(BaseModel):
    """Response model for a template with its items."""

    id: int
    name: str
    description: Optional[str] = None
    person_count: int
    items: list[TemplateItemResponse]


@router.get("", response_model=list[TemplateResponse])
def get_templates(
    session: Session = Depends(get_session),
    current_user: str = Depends(get_current_user),
):
    """Get all shopping templates.

    Returns:
        List of all templates with their items, sorted by name
    """
    statement = select(ShoppingTemplate).order_by(ShoppingTemplate.name)
    templates = session.exec(statement).all()

    # Convert to response model with items
    result = []
    for template in templates:
        items = [
            TemplateItemResponse(id=item.id, name=item.name, menge=item.menge)
            for item in template.template_items
        ]
        result.append(
            TemplateResponse(
                id=template.id,
                name=template.name,
                description=template.description,
                person_count=template.person_count,
                items=items,
            )
        )

    return result


@router.get("/{template_id}", response_model=TemplateResponse)
def get_template(
    template_id: int,
    session: Session = Depends(get_session),
    current_user: str = Depends(get_current_user),
):
    """Get a specific template by ID.

    Args:
        template_id: The ID of the template to retrieve

    Returns:
        Template with all its items

    Raises:
        HTTPException: 404 if template not found
    """
    template = session.get(ShoppingTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    items = [
        TemplateItemResponse(id=item.id, name=item.name, menge=item.menge)
        for item in template.template_items
    ]

    return TemplateResponse(
        id=template.id,
        name=template.name,
        description=template.description,
        person_count=template.person_count,
        items=items,
    )


@router.post("", response_model=TemplateResponse, status_code=201)
def create_template(
    template_data: TemplateCreate,
    session: Session = Depends(get_session),
    current_user: str = Depends(get_current_user),
):
    """Create a new shopping template with items.

    Args:
        template_data: Template data including name, description, and items

    Returns:
        Created template with generated ID

    Raises:
        HTTPException: 400 if template name already exists
    """
    # Check if template name already exists
    existing = session.exec(
        select(ShoppingTemplate).where(ShoppingTemplate.name == template_data.name)
    ).first()
    if existing:
        raise HTTPException(
            status_code=400, detail="Template with this name already exists"
        )

    # Create template
    template = ShoppingTemplate(
        name=template_data.name,
        description=template_data.description,
        person_count=template_data.person_count,
    )
    session.add(template)
    session.commit()
    session.refresh(template)

    # Create template items
    for item_data in template_data.items:
        item = TemplateItem(
            template_id=template.id, name=item_data.name, menge=item_data.menge
        )
        session.add(item)

    session.commit()
    session.refresh(template)

    # Return response
    items = [
        TemplateItemResponse(id=item.id, name=item.name, menge=item.menge)
        for item in template.template_items
    ]

    return TemplateResponse(
        id=template.id,
        name=template.name,
        description=template.description,
        person_count=template.person_count,
        items=items,
    )


@router.put("/{template_id}", response_model=TemplateResponse)
def update_template(
    template_id: int,
    template_data: TemplateUpdate,
    session: Session = Depends(get_session),
    current_user: str = Depends(get_current_user),
):
    """Update a template (partial update supported).

    Args:
        template_id: ID of the template to update
        template_data: Updated template data (all fields optional)

    Returns:
        Updated template

    Raises:
        HTTPException: 404 if template not found
        HTTPException: 400 if new name conflicts with existing template
    """
    template = session.get(ShoppingTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    # Update name if provided
    if template_data.name is not None:
        # Check if new name conflicts with another template
        if template_data.name != template.name:
            existing = session.exec(
                select(ShoppingTemplate).where(
                    ShoppingTemplate.name == template_data.name
                )
            ).first()
            if existing:
                raise HTTPException(
                    status_code=400, detail="Template with this name already exists"
                )
        template.name = template_data.name

    # Update description if provided
    if template_data.description is not None:
        template.description = template_data.description

    # Update person_count if provided
    if template_data.person_count is not None:
        template.person_count = template_data.person_count

    # Update items if provided (replace all items)
    if template_data.items is not None:
        # Delete existing items (cascade handles this automatically)
        for item in template.template_items:
            session.delete(item)

        # Create new items
        for item_data in template_data.items:
            item = TemplateItem(
                template_id=template.id, name=item_data.name, menge=item_data.menge
            )
            session.add(item)

    session.commit()
    session.refresh(template)

    # Return response
    items = [
        TemplateItemResponse(id=item.id, name=item.name, menge=item.menge)
        for item in template.template_items
    ]

    return TemplateResponse(
        id=template.id,
        name=template.name,
        description=template.description,
        person_count=template.person_count,
        items=items,
    )


@router.delete("/{template_id}", status_code=204)
def delete_template(
    template_id: int,
    session: Session = Depends(get_session),
    current_user: str = Depends(get_current_user),
):
    """Delete a template.

    Args:
        template_id: ID of the template to delete

    Raises:
        HTTPException: 404 if template not found

    Note:
        Template items are automatically deleted via cascade
    """
    template = session.get(ShoppingTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    session.delete(template)
    session.commit()

    return None
