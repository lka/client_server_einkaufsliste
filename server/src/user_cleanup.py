"""Cleanup utilities for removing expired data (users and items)."""

import os
from datetime import datetime, timedelta, timezone
from sqlmodel import Session, select
from .user_models import User
from .models import Item


def cleanup_expired_users(session: Session) -> int:
    """Delete unapproved users that are older than the configured expiry time.

    Args:
        session: Database session

    Returns:
        Number of users deleted
    """
    # Get expiry hours from environment (default 48 hours)
    expiry_hours = int(os.getenv("UNAPPROVED_USER_EXPIRY_HOURS", "48"))

    # Calculate cutoff time
    cutoff_time = datetime.now(timezone.utc) - timedelta(hours=expiry_hours)

    # Find expired unapproved users
    statement = select(User).where(
        User.is_approved == False,  # noqa: E712
        User.created_at < cutoff_time,
    )
    expired_users = session.exec(statement).all()

    # Delete expired users
    count = 0
    for user in expired_users:
        # Don't delete admin users
        if user.is_admin:
            continue

        print(
            f"Deleting expired unapproved user: {user.username} "
            f"(created: {user.created_at})"
        )
        session.delete(user)
        count += 1

    if count > 0:
        session.commit()
        print(f"Deleted {count} expired unapproved user(s)")
    else:
        print("No expired unapproved users to delete")

    return count


def cleanup_expired_items(session: Session) -> int:
    """Delete shopping list items older than the configured expiry time.

    Items are deleted based on their shopping_date. Items without a shopping_date
    are not deleted.

    Args:
        session: Database session

    Returns:
        Number of items deleted
    """
    # Get expiry hours from environment (default 48 hours)
    expiry_hours = int(os.getenv("UNAPPROVED_USER_EXPIRY_HOURS", "48"))

    # Calculate cutoff date (YYYY-MM-DD format)
    cutoff_date = (datetime.now(timezone.utc) - timedelta(hours=expiry_hours)).date()
    cutoff_date_str = cutoff_date.isoformat()

    # Find expired items (items with shopping_date before cutoff)
    statement = select(Item).where(
        Item.shopping_date.is_not(None),  # type: ignore
        Item.shopping_date < cutoff_date_str,  # type: ignore
    )
    expired_items = session.exec(statement).all()

    # Delete expired items
    count = 0
    for item in expired_items:
        print(
            f"Deleting expired item: {item.name} "
            f"(shopping_date: {item.shopping_date})"
        )
        session.delete(item)
        count += 1

    if count > 0:
        session.commit()
        print(f"Deleted {count} expired shopping list item(s)")
    else:
        print("No expired shopping list items to delete")

    return count
