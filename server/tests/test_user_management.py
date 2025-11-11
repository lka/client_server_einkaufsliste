"""Tests for user management endpoints."""

from fastapi.testclient import TestClient
from sqlmodel import Session, select
from server.src.main import app
from server.src.db import get_engine
from server.src.user_models import User

client = TestClient(app)


def create_approved_user(username: str, email: str, password: str) -> str:
    """Helper to create an approved user and return auth token."""
    # Register user
    register_data = {
        "username": username,
        "email": email,
        "password": password,
    }
    r = client.post("/api/auth/register", json=register_data)

    # Approve the user directly in the database
    engine = get_engine()
    with Session(engine) as session:
        statement = select(User).where(User.username == username)
        user = session.exec(statement).first()
        if user:
            user.is_approved = True
            session.add(user)
            session.commit()

    # Login and return token
    login_data = {"username": username, "password": password}
    r = client.post("/api/auth/login", json=login_data)
    assert r.status_code == 200
    return r.json()["access_token"]


def test_register_creates_unapproved_user():
    """Test that new users are created with is_approved=False."""
    user_data = {
        "username": "unapproveduser",
        "email": "unapproved@example.com",
        "password": "testpass123",
    }
    r = client.post("/api/auth/register", json=user_data)
    assert r.status_code == 201

    user_response = r.json()
    assert user_response["username"] == "unapproveduser"
    assert user_response["is_approved"] is False
    assert user_response["is_admin"] is False


def test_unapproved_user_cannot_login():
    """Test that unapproved users cannot login."""
    # Register a new user
    user_data = {
        "username": "blockeduser",
        "email": "blocked@example.com",
        "password": "testpass123",
    }
    r = client.post("/api/auth/register", json=user_data)
    assert r.status_code == 201

    # Try to login (should fail with 403)
    login_data = {"username": "blockeduser", "password": "testpass123"}
    r = client.post("/api/auth/login", json=login_data)
    assert r.status_code == 403
    assert "not yet approved" in r.json()["detail"]


def test_get_all_users():
    """Test getting all users (requires approved user)."""
    token = create_approved_user("userlist", "userlist@example.com", "pass123")
    headers = {"Authorization": f"Bearer {token}"}

    # Get all users
    r = client.get("/api/users", headers=headers)
    assert r.status_code == 200
    users = r.json()
    assert isinstance(users, list)
    assert len(users) > 0

    # Verify structure
    assert "username" in users[0]
    assert "is_approved" in users[0]
    assert "is_admin" in users[0]
    assert "created_at" in users[0]


def test_get_all_users_requires_approval():
    """Test that only approved users can get user list."""
    # Register unapproved user
    user_data = {
        "username": "unapprovednoaccess",
        "email": "noaccess@example.com",
        "password": "pass123",
    }
    client.post("/api/auth/register", json=user_data)

    # Cannot access without being approved (can't even login)
    login_data = {"username": "unapprovednoaccess", "password": "pass123"}
    r = client.post("/api/auth/login", json=login_data)
    assert r.status_code == 403


def test_get_pending_users():
    """Test getting pending (unapproved) users."""
    token = create_approved_user("approver", "approver@example.com", "pass123")
    headers = {"Authorization": f"Bearer {token}"}

    # Create some unapproved users
    client.post(
        "/api/auth/register",
        json={
            "username": "pending1",
            "email": "pending1@example.com",
            "password": "pass123",
        },
    )
    client.post(
        "/api/auth/register",
        json={
            "username": "pending2",
            "email": "pending2@example.com",
            "password": "pass123",
        },
    )

    # Get pending users
    r = client.get("/api/users/pending", headers=headers)
    assert r.status_code == 200
    pending = r.json()
    assert isinstance(pending, list)

    # Should have at least the 2 we just created
    pending_usernames = [u["username"] for u in pending]
    assert "pending1" in pending_usernames
    assert "pending2" in pending_usernames

    # All should be unapproved
    for user in pending:
        assert user["is_approved"] is False


def test_approve_user():
    """Test approving a pending user."""
    token = create_approved_user("approveruser", "approveruser@example.com", "pass123")
    headers = {"Authorization": f"Bearer {token}"}

    # Create unapproved user
    r = client.post(
        "/api/auth/register",
        json={
            "username": "needsapproval",
            "email": "needsapproval@example.com",
            "password": "pass123",
        },
    )
    assert r.status_code == 201
    user_data = r.json()
    user_id = user_data["id"]
    assert user_data["is_approved"] is False

    # Approve the user
    r = client.post(f"/api/users/{user_id}/approve", headers=headers)
    assert r.status_code == 200
    approved_user = r.json()
    assert approved_user["id"] == user_id
    assert approved_user["is_approved"] is True

    # Now the user should be able to login
    login_data = {"username": "needsapproval", "password": "pass123"}
    r = client.post("/api/auth/login", json=login_data)
    assert r.status_code == 200
    assert "access_token" in r.json()


def test_approve_nonexistent_user():
    """Test approving a nonexistent user."""
    token = create_approved_user("approver2", "approver2@example.com", "pass123")
    headers = {"Authorization": f"Bearer {token}"}

    r = client.post("/api/users/999999/approve", headers=headers)
    assert r.status_code == 404


def test_unapproved_user_cannot_approve_others():
    """Test that unapproved users cannot approve others (can't even login)."""
    # Create unapproved user
    client.post(
        "/api/auth/register",
        json={
            "username": "unapprovedapprover",
            "email": "unapprovedapprover@example.com",
            "password": "pass123",
        },
    )

    # Try to login (should fail)
    login_data = {"username": "unapprovedapprover", "password": "pass123"}
    r = client.post("/api/auth/login", json=login_data)
    assert r.status_code == 403


def test_user_management_requires_auth():
    """Test that all user management endpoints require authentication."""
    # Get all users without auth
    r = client.get("/api/users")
    assert r.status_code == 403

    # Get pending users without auth
    r = client.get("/api/users/pending")
    assert r.status_code == 403

    # Approve user without auth
    r = client.post("/api/users/1/approve")
    assert r.status_code == 403


def test_approved_user_can_approve_others():
    """Test that any approved user can approve pending users."""
    # Create first approved user
    token1 = create_approved_user("approver3", "approver3@example.com", "pass123")
    headers1 = {"Authorization": f"Bearer {token1}"}

    # Create pending user
    r = client.post(
        "/api/auth/register",
        json={
            "username": "tobeapproved",
            "email": "tobeapproved@example.com",
            "password": "pass123",
        },
    )
    pending_user_id = r.json()["id"]

    # First user approves the pending user
    r = client.post(f"/api/users/{pending_user_id}/approve", headers=headers1)
    assert r.status_code == 200
    assert r.json()["is_approved"] is True

    # Now create another pending user
    r = client.post(
        "/api/auth/register",
        json={
            "username": "anotherone",
            "email": "anotherone@example.com",
            "password": "pass123",
        },
    )
    another_user_id = r.json()["id"]

    # The newly approved user should also be able to approve
    token2 = create_approved_user("tobeapproved", "tobeapproved@example.com", "pass123")
    headers2 = {"Authorization": f"Bearer {token2}"}

    r = client.post(f"/api/users/{another_user_id}/approve", headers=headers2)
    assert r.status_code == 200
    assert r.json()["is_approved"] is True
