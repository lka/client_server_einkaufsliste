"""User models for authentication."""

from typing import Optional, TYPE_CHECKING
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from .models import Item


class User(SQLModel, table=True):
    """User model for authentication.

    Attributes:
        id: Auto-incrementing primary key
        username: Unique username
        email: User email address
        hashed_password: Bcrypt hashed password
        is_active: Whether the user account is active
        is_approved: Whether the user is approved by admin/other users
        is_admin: Whether the user is an administrator
        created_at: Timestamp when user was created
    """

    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True, max_length=50)
    email: str = Field(unique=True, max_length=100)
    hashed_password: str
    is_active: bool = Field(default=True)
    is_approved: bool = Field(default=False, index=True)
    is_admin: bool = Field(default=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Relationships
    items: list["Item"] = Relationship(back_populates="user")


class UserCreate(SQLModel):
    """Schema for creating a new user.

    Attributes:
        username: Desired username
        email: User email address
        password: Plain text password (will be hashed)
    """

    username: str
    email: str
    password: str


class UserLogin(SQLModel):
    """Schema for user login.

    Attributes:
        username: Username
        password: Plain text password
    """

    username: str
    password: str


class Token(SQLModel):
    """Schema for JWT token response.

    Attributes:
        access_token: JWT access token
        token_type: Token type (always "bearer")
        expires_in: Token expiration time in seconds
    """

    access_token: str
    token_type: str = "bearer"
    expires_in: int


class UserResponse(SQLModel):
    """Schema for user data in responses (without password).

    Attributes:
        id: User ID
        username: Username
        email: Email address
        is_active: Whether the account is active
        is_approved: Whether the user is approved
        is_admin: Whether the user is an administrator
        created_at: Timestamp when user was created
    """

    id: int
    username: str
    email: str
    is_active: bool
    is_approved: bool
    is_admin: bool
    created_at: datetime
