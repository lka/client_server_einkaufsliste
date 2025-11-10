"""Admin user setup and management utilities."""

import os
from sqlmodel import Session, select
from .user_models import User
from .auth import get_password_hash


def create_or_update_admin_user(session: Session) -> User:
    """Create or update the admin user from environment variables.

    Args:
        session: Database session

    Returns:
        The admin user instance

    Raises:
        ValueError: If admin credentials are not set in environment
    """
    admin_username = os.getenv("ADMIN_USERNAME")
    admin_password = os.getenv("ADMIN_PASSWORD")
    admin_email = os.getenv("ADMIN_EMAIL", "admin@example.com")

    if not admin_username or not admin_password:
        raise ValueError("ADMIN_USERNAME and ADMIN_PASSWORD must be set in .env file")

    # Check if admin user exists
    statement = select(User).where(User.username == admin_username)
    admin_user = session.exec(statement).first()

    if admin_user:
        # Update existing admin user
        admin_user.hashed_password = get_password_hash(admin_password)
        admin_user.email = admin_email
        admin_user.is_admin = True
        admin_user.is_approved = True
        admin_user.is_active = True
        session.add(admin_user)
        session.commit()
        session.refresh(admin_user)
        print(f"Admin user '{admin_username}' updated successfully")
    else:
        # Create new admin user
        admin_user = User(
            username=admin_username,
            email=admin_email,
            hashed_password=get_password_hash(admin_password),
            is_admin=True,
            is_approved=True,
            is_active=True,
        )
        session.add(admin_user)
        session.commit()
        session.refresh(admin_user)
        print(f"Admin user '{admin_username}' created successfully")

    return admin_user
