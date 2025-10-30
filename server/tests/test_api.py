"""Integration tests for the items API."""

from fastapi.testclient import TestClient
from server.src.main import app

client = TestClient(app)


def test_crud_items():
    """Integration test for CRUD operations against the items API.

    Verifies create, read and delete behavior using an in-memory SQLite
    database configured for the test run.
    """
    # start with empty
    r = client.get("/api/items")
    assert r.status_code == 200
    assert isinstance(r.json(), list)

    # create
    r = client.post("/api/items", json={"name": "Milch"})
    assert r.status_code == 201
    created = r.json()
    assert "id" in created and created["name"] == "Milch"

    # list contains it
    r = client.get("/api/items")
    assert any(it["id"] == created["id"] for it in r.json())

    # delete
    r = client.delete(f"/api/items/{created['id']}")
    assert r.status_code == 204

    # no longer present
    r = client.get("/api/items")
    assert all(it["id"] != created["id"] for it in r.json())
