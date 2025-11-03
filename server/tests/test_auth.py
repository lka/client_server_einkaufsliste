"""Integration tests for authentication endpoints."""

from fastapi.testclient import TestClient
from server.src.main import app

client = TestClient(app)


def test_register_user():
    """Test user registration endpoint."""
    user_data = {
        "username": "newuser",
        "email": "newuser@example.com",
        "password": "securepass123",
    }
    r = client.post("/api/auth/register", json=user_data)

    # Should succeed or fail if user already exists
    assert r.status_code in [201, 400]

    if r.status_code == 201:
        data = r.json()
        assert data["username"] == "newuser"
        assert data["email"] == "newuser@example.com"
        assert "hashed_password" not in data  # Password should not be returned


def test_login_user():
    """Test user login endpoint."""
    # First ensure user exists
    user_data = {
        "username": "logintest",
        "email": "logintest@example.com",
        "password": "testpass123",
    }
    client.post("/api/auth/register", json=user_data)

    # Now try to login
    login_data = {"username": "logintest", "password": "testpass123"}
    r = client.post("/api/auth/login", json=login_data)
    assert r.status_code == 200

    data = r.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_invalid_credentials():
    """Test login with invalid credentials."""
    login_data = {"username": "nonexistent", "password": "wrongpassword"}
    r = client.post("/api/auth/login", json=login_data)
    assert r.status_code == 401


def test_protected_endpoint_without_auth():
    """Test that protected endpoints reject requests without authentication."""
    r = client.get("/api/items")
    assert r.status_code == 403  # Forbidden


def test_protected_endpoint_with_auth():
    """Test that protected endpoints accept valid JWT tokens."""
    # Register and login
    user_data = {
        "username": "authtest",
        "email": "authtest@example.com",
        "password": "testpass123",
    }
    client.post("/api/auth/register", json=user_data)

    login_data = {"username": "authtest", "password": "testpass123"}
    r = client.post("/api/auth/login", json=login_data)
    token = r.json()["access_token"]

    # Access protected endpoint with token
    headers = {"Authorization": f"Bearer {token}"}
    r = client.get("/api/items", headers=headers)
    assert r.status_code == 200


def test_get_current_user():
    """Test getting current user information."""
    # Register and login
    user_data = {
        "username": "metest",
        "email": "metest@example.com",
        "password": "testpass123",
    }
    client.post("/api/auth/register", json=user_data)

    login_data = {"username": "metest", "password": "testpass123"}
    r = client.post("/api/auth/login", json=login_data)
    token = r.json()["access_token"]

    # Get current user info
    headers = {"Authorization": f"Bearer {token}"}
    r = client.get("/api/auth/me", headers=headers)
    assert r.status_code == 200

    data = r.json()
    assert data["username"] == "metest"
    assert data["email"] == "metest@example.com"
    assert "hashed_password" not in data


def test_delete_user():
    """Test deleting current user account."""
    # Register and login
    user_data = {
        "username": "deletetest",
        "email": "deletetest@example.com",
        "password": "testpass123",
    }
    r = client.post("/api/auth/register", json=user_data)
    assert r.status_code == 201

    login_data = {"username": "deletetest", "password": "testpass123"}
    r = client.post("/api/auth/login", json=login_data)
    token = r.json()["access_token"]

    # Delete user account
    headers = {"Authorization": f"Bearer {token}"}
    r = client.delete("/api/auth/me", headers=headers)
    assert r.status_code == 204

    # Try to login again - should fail
    r = client.post("/api/auth/login", json=login_data)
    assert r.status_code == 401

    # Try to access protected endpoint with old token - should fail
    r = client.get("/api/items", headers=headers)
    assert r.status_code == 401


def test_delete_user_without_auth():
    """Test that delete user endpoint requires authentication."""
    r = client.delete("/api/auth/me")
    assert r.status_code == 403  # Forbidden


def test_refresh_token():
    """Test token refresh endpoint."""
    # Register and login
    user_data = {
        "username": "refreshtest",
        "email": "refreshtest@example.com",
        "password": "testpass123",
    }
    client.post("/api/auth/register", json=user_data)

    login_data = {"username": "refreshtest", "password": "testpass123"}
    r = client.post("/api/auth/login", json=login_data)
    old_token = r.json()["access_token"]

    # Refresh token
    headers = {"Authorization": f"Bearer {old_token}"}
    r = client.post("/api/auth/refresh", headers=headers)
    assert r.status_code == 200

    data = r.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    new_token = data["access_token"]

    # New token should work for protected endpoints
    headers = {"Authorization": f"Bearer {new_token}"}
    r = client.get("/api/items", headers=headers)
    assert r.status_code == 200


def test_refresh_token_without_auth():
    """Test that refresh endpoint requires authentication."""
    r = client.post("/api/auth/refresh")
    assert r.status_code == 403  # Forbidden
