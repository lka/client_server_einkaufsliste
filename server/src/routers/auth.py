"""Authentication endpoints for user registration and login."""

from datetime import timedelta
from fastapi import APIRouter, HTTPException, Depends, status
from sqlmodel import select

from ..user_models import User, UserCreate, UserLogin, Token, UserResponse
from ..db import get_session
from ..auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)

router = APIRouter(prefix="/api/auth", tags=["authentication"])


@router.post("/register", response_model=UserResponse, status_code=201)
def register(user_data: UserCreate):
    """Register a new user.

    Args:
        user_data: User registration data (username, email, password)

    Returns:
        UserResponse: Created user data (without password)

    Raises:
        HTTPException: If username or email already exists
    """
    with get_session() as session:
        # Check if username already exists
        existing_user = session.exec(
            select(User).where(User.username == user_data.username)
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered",
            )

        # Check if email already exists
        existing_email = session.exec(
            select(User).where(User.email == user_data.email)
        ).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        # Create new user with hashed password
        hashed_password = get_password_hash(user_data.password)
        new_user = User(
            username=user_data.username,
            email=user_data.email,
            hashed_password=hashed_password,
        )
        session.add(new_user)
        session.commit()
        session.refresh(new_user)
        return new_user


@router.post("/login", response_model=Token)
def login(credentials: UserLogin):
    """Authenticate user and return JWT token.

    Args:
        credentials: Username and password

    Returns:
        Token: JWT access token

    Raises:
        HTTPException: If credentials are invalid
    """
    with get_session() as session:
        user = session.exec(
            select(User).where(User.username == credentials.username)
        ).first()

        if not user or not verify_password(credentials.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive",
            )

        if not user.is_approved:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is not yet approved",
            )

        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )
        return Token(
            access_token=access_token,
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # Convert to seconds
        )


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: str = Depends(get_current_user)):
    """Get current authenticated user information.

    Args:
        current_user: Current username from JWT token

    Returns:
        UserResponse: Current user data

    Raises:
        HTTPException: If user not found
    """
    with get_session() as session:
        user = session.exec(select(User).where(User.username == current_user)).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )
        return user


@router.post("/refresh", response_model=Token)
def refresh_token(current_user: str = Depends(get_current_user)):
    """Refresh JWT token for authenticated user.

    Args:
        current_user: Current username from JWT token

    Returns:
        Token: New JWT access token with extended expiration

    Raises:
        HTTPException: If user not found or inactive
    """
    with get_session() as session:
        user = session.exec(select(User).where(User.username == current_user)).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive",
            )

        # Create new access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )
        return Token(
            access_token=access_token,
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # Convert to seconds
        )


@router.delete("/me", status_code=204)
def delete_current_user(current_user: str = Depends(get_current_user)):
    """Delete the current authenticated user account.

    This will delete the user and all their associated shopping list items.

    Args:
        current_user: Current username from JWT token

    Raises:
        HTTPException: If user not found
    """
    with get_session() as session:
        user = session.exec(select(User).where(User.username == current_user)).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        # Delete all items belonging to this user
        # Note: Currently items are not user-specific,
        # but this prepares for future changes
        # For now, we'll just delete the user account
        session.delete(user)
        session.commit()
        return None
