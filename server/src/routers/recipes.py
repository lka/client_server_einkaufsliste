"""Recipe management endpoints."""

from typing import List
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlmodel import select, col

from ..models import Recipe
from ..db import get_session
from ..auth import get_current_user

router = APIRouter(prefix="/api/recipes", tags=["recipes"])


@router.get("/search", response_model=List[dict])
def search_recipes(
    query: str = Query(..., min_length=1, description="Search query for recipe names"),
    limit: int = Query(10, ge=1, le=50, description="Maximum number of results"),
    current_user: str = Depends(get_current_user),
):
    """Search recipes by name (requires authentication).

    Args:
        query: Search query string
        limit: Maximum number of results to return
        current_user: Current authenticated username from JWT

    Returns:
        List[dict]: List of matching recipes with id and name
    """
    with get_session() as session:
        # Search for recipes where name contains the query (case-insensitive)
        statement = (
            select(Recipe).where(col(Recipe.name).ilike(f"%{query}%")).limit(limit)
        )
        recipes = session.exec(statement).all()

        # Return simplified recipe list with just id and name
        return [{"id": recipe.id, "name": recipe.name} for recipe in recipes]


@router.get("/{recipe_id}", response_model=dict)
def get_recipe(recipe_id: int, current_user: str = Depends(get_current_user)):
    """Get a recipe by ID (requires authentication).

    Args:
        recipe_id: Recipe ID
        current_user: Current authenticated username from JWT

    Returns:
        dict: Recipe details

    Raises:
        HTTPException: If recipe not found
    """
    with get_session() as session:
        recipe = session.get(Recipe, recipe_id)
        if not recipe:
            raise HTTPException(status_code=404, detail="Recipe not found")

        return {
            "id": recipe.id,
            "name": recipe.name,
            "category": recipe.category,
            "tags": recipe.tags,
            "data": recipe.data,
            "imported_at": recipe.imported_at,
        }


@router.get("", response_model=List[dict])
def get_recipes(
    skip: int = Query(0, ge=0, description="Number of recipes to skip"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of results"),
    current_user: str = Depends(get_current_user),
):
    """Get all recipes with pagination (requires authentication).

    Args:
        skip: Number of recipes to skip
        limit: Maximum number of results to return
        current_user: Current authenticated username from JWT

    Returns:
        List[dict]: List of recipes with basic information
    """
    with get_session() as session:
        statement = select(Recipe).offset(skip).limit(limit)
        recipes = session.exec(statement).all()

        # Return simplified recipe list
        return [
            {
                "id": recipe.id,
                "name": recipe.name,
                "category": recipe.category,
            }
            for recipe in recipes
        ]
