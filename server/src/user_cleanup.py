"""User cleanup utilities for removing expired unapproved users."""

import os
from datetime import datetime, timedelta
from sqlmodel import Session, select
from .user_models import User


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
    cutoff_time = datetime.utcnow() - timedelta(hours=expiry_hours)

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
