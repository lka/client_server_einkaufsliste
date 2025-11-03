"""Integration tests for the items API."""

from fastapi.testclient import TestClient
from server.src.main import app

client = TestClient(app)


def get_auth_token():
    """Helper function to register a test user and get auth token."""
    # Register test user
    register_data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpass123",
    }
    r = client.post("/api/auth/register", json=register_data)

    # If user already exists (from previous test run), just login
    if r.status_code == 400:
        login_data = {"username": "testuser", "password": "testpass123"}
        r = client.post("/api/auth/login", json=login_data)
    else:
        # Login with newly registered user
        login_data = {"username": "testuser", "password": "testpass123"}
        r = client.post("/api/auth/login", json=login_data)

    assert r.status_code == 200
    token = r.json()["access_token"]
    return token


def test_crud_items():
    """Integration test for CRUD operations against the items API.

    Verifies create, read and delete behavior using an in-memory SQLite
    database configured for the test run.
    """
    # Get authentication token
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # start with empty
    r = client.get("/api/items", headers=headers)
    assert r.status_code == 200
    assert isinstance(r.json(), list)

    # create
    r = client.post("/api/items", json={"name": "Milch"}, headers=headers)
    assert r.status_code == 201
    created = r.json()
    assert "id" in created and created["name"] == "Milch"

    # list contains it
    r = client.get("/api/items", headers=headers)
    assert any(it["id"] == created["id"] for it in r.json())

    # delete
    r = client.delete(f"/api/items/{created['id']}", headers=headers)
    assert r.status_code == 204

    # no longer present
    r = client.get("/api/items", headers=headers)
    assert all(it["id"] != created["id"] for it in r.json())
