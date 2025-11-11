"""User management endpoints for viewing and approving users."""

from typing import List
from fastapi import APIRouter, HTTPException, Depends, status
from sqlmodel import select

from ..user_models import User, UserResponse
from ..db import get_session
from ..auth import get_current_user

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("", response_model=List[UserResponse])
def get_all_users(current_user: str = Depends(get_current_user)):
    """Get all users (requires authentication and approval).

    Args:
        current_user: Current authenticated username from JWT

    Returns:
        List[UserResponse]: All users in the system

    Raises:
        HTTPException: If user not found or not approved
    """
    with get_session() as session:
        user = session.exec(select(User).where(User.username == current_user)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        if not user.is_approved:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view users",
            )

        users = session.exec(select(User)).all()
        return users


@router.get("/pending", response_model=List[UserResponse])
def get_pending_users(current_user: str = Depends(get_current_user)):
    """Get all pending (unapproved) users (requires authentication and approval).

    Args:
        current_user: Current authenticated username from JWT

    Returns:
        List[UserResponse]: All pending users

    Raises:
        HTTPException: If user not found or not approved
    """
    with get_session() as session:
        user = session.exec(select(User).where(User.username == current_user)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        if not user.is_approved:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view users",
            )

        pending_users = session.exec(
            select(User).where(User.is_approved == False)  # noqa: E712
        ).all()
        return pending_users


@router.post("/{user_id}/approve", response_model=UserResponse)
def approve_user(user_id: int, current_user: str = Depends(get_current_user)):
    """Approve a pending user (requires authentication and approval).

    Args:
        user_id: ID of user to approve
        current_user: Current authenticated username from JWT

    Returns:
        UserResponse: The approved user

    Raises:
        HTTPException: If user not found or not authorized
    """
    with get_session() as session:
        # Check if current user is approved
        requester = session.exec(
            select(User).where(User.username == current_user)
        ).first()
        if not requester:
            raise HTTPException(status_code=404, detail="User not found")
        if not requester.is_approved:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to approve users",
            )

        # Get and approve target user
        target_user = session.get(User, user_id)
        if not target_user:
            raise HTTPException(status_code=404, detail="User to approve not found")

        target_user.is_approved = True
        session.add(target_user)
        session.commit()
        session.refresh(target_user)
        return target_user
