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


def test_item_with_menge():
    """Test creating items with optional menge (quantity) field."""
    # Get authentication token
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Create item without menge
    r = client.post("/api/items", json={"name": "Äpfel"}, headers=headers)
    assert r.status_code == 201
    item_without_menge = r.json()
    assert item_without_menge["name"] == "Äpfel"
    assert item_without_menge.get("menge") is None

    # Create item with menge
    r = client.post(
        "/api/items", json={"name": "Möhren", "menge": "500 g"}, headers=headers
    )
    assert r.status_code == 201
    item_with_menge = r.json()
    assert item_with_menge["name"] == "Möhren"
    assert item_with_menge["menge"] == "500 g"

    # Verify both items are in the list
    r = client.get("/api/items", headers=headers)
    assert r.status_code == 200
    items = r.json()
    assert any(
        it["id"] == item_without_menge["id"] and it.get("menge") is None for it in items
    )
    assert any(
        it["id"] == item_with_menge["id"] and it["menge"] == "500 g" for it in items
    )

    # Cleanup
    client.delete(f"/api/items/{item_without_menge['id']}", headers=headers)
    client.delete(f"/api/items/{item_with_menge['id']}", headers=headers)


def test_quantity_merging_same_unit():
    """Test that adding an existing item with same unit sums the quantities."""
    # Get authentication token
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Create item with quantity
    r = client.post(
        "/api/items", json={"name": "Kartoffeln", "menge": "500 g"}, headers=headers
    )
    assert r.status_code == 201
    first_item = r.json()
    assert first_item["menge"] == "500 g"
    first_id = first_item["id"]

    # Add same item with same unit - should merge
    r = client.post(
        "/api/items", json={"name": "Kartoffeln", "menge": "300 g"}, headers=headers
    )
    assert r.status_code == 201
    merged_item = r.json()
    assert merged_item["name"] == "Kartoffeln"
    assert merged_item["menge"] == "800 g"
    assert merged_item["id"] == first_id  # Same ID

    # Verify only one item exists
    r = client.get("/api/items", headers=headers)
    items = r.json()
    kartoffeln_items = [it for it in items if it["name"] == "Kartoffeln"]
    assert len(kartoffeln_items) == 1
    assert kartoffeln_items[0]["menge"] == "800 g"

    # Cleanup
    client.delete(f"/api/items/{first_id}", headers=headers)


def test_quantity_merging_different_unit():
    """Test that adding an existing item with different unit combines quantities."""
    # Get authentication token
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Create item with quantity in grams
    r = client.post(
        "/api/items", json={"name": "Zucker", "menge": "500 g"}, headers=headers
    )
    assert r.status_code == 201
    first_item = r.json()
    first_id = first_item["id"]

    # Add same item with different unit - should combine with comma
    r = client.post(
        "/api/items", json={"name": "Zucker", "menge": "2 Packungen"}, headers=headers
    )
    assert r.status_code == 201
    updated_item = r.json()
    assert updated_item["name"] == "Zucker"
    assert updated_item["menge"] == "500 g, 2 Packungen"
    assert updated_item["id"] == first_id

    # Cleanup
    client.delete(f"/api/items/{first_id}", headers=headers)


def test_quantity_merging_no_unit():
    """Test that adding items without units sums the numbers."""
    # Get authentication token
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Create item with number only
    r = client.post("/api/items", json={"name": "Eier", "menge": "6"}, headers=headers)
    assert r.status_code == 201
    first_item = r.json()
    first_id = first_item["id"]

    # Add same item with number only - should sum
    r = client.post("/api/items", json={"name": "Eier", "menge": "12"}, headers=headers)
    assert r.status_code == 201
    merged_item = r.json()
    assert merged_item["name"] == "Eier"
    assert merged_item["menge"] == "18"
    assert merged_item["id"] == first_id

    # Cleanup
    client.delete(f"/api/items/{first_id}", headers=headers)


def test_quantity_merging_complex_list():
    """Test merging quantities in a comma-separated list."""
    # Get authentication token
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Create item with quantity in grams
    r = client.post(
        "/api/items", json={"name": "Mehl", "menge": "500 g"}, headers=headers
    )
    assert r.status_code == 201
    first_item = r.json()
    first_id = first_item["id"]

    # Add different unit - should combine with comma
    r = client.post(
        "/api/items", json={"name": "Mehl", "menge": "2 Packungen"}, headers=headers
    )
    assert r.status_code == 201
    updated_item = r.json()
    assert updated_item["menge"] == "500 g, 2 Packungen"

    # Add more grams - should find and sum the existing grams
    r = client.post(
        "/api/items", json={"name": "Mehl", "menge": "300 g"}, headers=headers
    )
    assert r.status_code == 201
    updated_item = r.json()
    assert updated_item["menge"] == "800 g, 2 Packungen"

    # Add more Packungen - should find and sum the existing Packungen
    r = client.post(
        "/api/items", json={"name": "Mehl", "menge": "3 Packungen"}, headers=headers
    )
    assert r.status_code == 201
    updated_item = r.json()
    assert updated_item["menge"] == "800 g, 5 Packungen"

    # Cleanup
    client.delete(f"/api/items/{first_id}", headers=headers)


def test_fuzzy_matching_similar_names():
    """Test that similar product names are merged using fuzzy matching."""
    # Get authentication token
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Create item with "Möhren"
    r = client.post(
        "/api/items", json={"name": "Möhren", "menge": "500 g"}, headers=headers
    )
    assert r.status_code == 201
    first_item = r.json()
    first_id = first_item["id"]
    assert first_item["name"] == "Möhren"
    assert first_item["menge"] == "500 g"

    # Add "Möhre" (singular) - should match with "Möhren" via fuzzy matching
    r = client.post(
        "/api/items", json={"name": "Möhre", "menge": "300 g"}, headers=headers
    )
    assert r.status_code == 201
    merged_item = r.json()
    assert merged_item["id"] == first_id  # Same item
    assert merged_item["name"] == "Möhren"  # Keeps original name
    assert merged_item["menge"] == "800 g"  # Quantities merged

    # Add "Moehre" (alternative spelling) - should also match
    r = client.post(
        "/api/items", json={"name": "Moehre", "menge": "200 g"}, headers=headers
    )
    assert r.status_code == 201
    merged_item = r.json()
    assert merged_item["id"] == first_id  # Same item
    assert merged_item["name"] == "Möhren"  # Still keeps original name
    assert merged_item["menge"] == "1000 g"  # 800 + 200

    # Verify only one item exists
    r = client.get("/api/items", headers=headers)
    items = r.json()
    moehren_items = [
        it for it in items if it["name"].lower() in ["möhren", "möhre", "moehre"]
    ]
    assert len(moehren_items) == 1
    assert moehren_items[0]["menge"] == "1000 g"

    # Cleanup
    client.delete(f"/api/items/{first_id}", headers=headers)


def test_fuzzy_matching_kartoffel():
    """Test fuzzy matching with Kartoffel/Kartoffeln."""
    # Get authentication token
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Create item with "Kartoffeln"
    r = client.post(
        "/api/items", json={"name": "Kartoffeln", "menge": "1000 g"}, headers=headers
    )
    assert r.status_code == 201
    first_item = r.json()
    first_id = first_item["id"]

    # Add "Kartoffel" (singular) - should match
    r = client.post(
        "/api/items", json={"name": "Kartoffel", "menge": "500 g"}, headers=headers
    )
    assert r.status_code == 201
    merged_item = r.json()
    assert merged_item["id"] == first_id
    assert merged_item["name"] == "Kartoffeln"
    assert merged_item["menge"] == "1500 g"

    # Cleanup
    client.delete(f"/api/items/{first_id}", headers=headers)


def test_fuzzy_matching_no_false_positives():
    """Test that dissimilar names don't match."""
    # Get authentication token
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Create "Äpfel"
    r = client.post(
        "/api/items", json={"name": "Äpfel", "menge": "500 g"}, headers=headers
    )
    assert r.status_code == 201
    apfel_item = r.json()
    apfel_id = apfel_item["id"]

    # Add "Birnen" - should NOT match (too different)
    r = client.post(
        "/api/items", json={"name": "Birnen", "menge": "300 g"}, headers=headers
    )
    assert r.status_code == 201
    birnen_item = r.json()
    birnen_id = birnen_item["id"]
    assert birnen_id != apfel_id  # Different items

    # Verify two separate items exist
    r = client.get("/api/items", headers=headers)
    items = r.json()
    fruit_items = [it for it in items if it["name"] in ["Äpfel", "Birnen"]]
    assert len(fruit_items) == 2

    # Cleanup
    client.delete(f"/api/items/{apfel_id}", headers=headers)
    client.delete(f"/api/items/{birnen_id}", headers=headers)


def test_comma_separated_input():
    """Test that comma-separated input quantities are processed separately."""
    # Get authentication token
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Create item with quantity in grams
    r = client.post(
        "/api/items", json={"name": "Reis", "menge": "500 g"}, headers=headers
    )
    assert r.status_code == 201
    first_item = r.json()
    first_id = first_item["id"]
    assert first_item["menge"] == "500 g"

    # Add comma-separated input: "2, 300 g"
    # Should process "2" (no unit) and "300 g" separately
    r = client.post(
        "/api/items", json={"name": "Reis", "menge": "2, 300 g"}, headers=headers
    )
    assert r.status_code == 201
    updated_item = r.json()
    assert updated_item["name"] == "Reis"
    # Should sum the grams (500 + 300 = 800) and append "2"
    assert updated_item["menge"] == "800 g, 2"
    assert updated_item["id"] == first_id

    # Verify only one item exists
    r = client.get("/api/items", headers=headers)
    items = r.json()
    reis_items = [it for it in items if it["name"] == "Reis"]
    assert len(reis_items) == 1
    assert reis_items[0]["menge"] == "800 g, 2"

    # Cleanup
    client.delete(f"/api/items/{first_id}", headers=headers)


def test_delete_store_items():
    """Test deleting all items for a specific store."""
    # Get authentication token
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Get a store ID (should have seeded stores)
    r = client.get("/api/stores", headers=headers)
    assert r.status_code == 200
    stores = r.json()
    assert len(stores) > 0
    store_id = stores[0]["id"]

    # Create multiple items for this store (use unique names to avoid merging)
    r1 = client.post(
        "/api/items",
        json={"name": "TestItemApple", "store_id": store_id},
        headers=headers,
    )
    assert r1.status_code == 201

    r2 = client.post(
        "/api/items",
        json={"name": "TestItemBanana", "store_id": store_id},
        headers=headers,
    )
    assert r2.status_code == 201

    # Create item for different store (if exists) or without store
    r3 = client.post("/api/items", json={"name": "TestItemCherry"}, headers=headers)
    assert r3.status_code == 201
    item3_id = r3.json()["id"]

    # Verify all 3 distinct items exist
    r = client.get("/api/items", headers=headers)
    items = r.json()
    test_items = [it for it in items if "TestItem" in it["name"]]
    assert len(test_items) == 3

    # Delete all items for the store
    r = client.delete(f"/api/stores/{store_id}/items", headers=headers)
    assert r.status_code == 204

    # Verify items for this store are deleted
    r = client.get("/api/items", headers=headers)
    items = r.json()
    test_items = [it for it in items if "TestItem" in it["name"]]
    # Should only have item3 (Cherry) remaining
    assert len(test_items) == 1
    assert test_items[0]["id"] == item3_id
    assert test_items[0]["name"] == "TestItemCherry"

    # Cleanup
    client.delete(f"/api/items/{item3_id}", headers=headers)


def test_convert_item_to_product():
    """Test converting an item to a product with department assignment."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Get a store and department
    r = client.get("/api/stores", headers=headers)
    stores = r.json()
    store_id = stores[0]["id"]

    r = client.get(f"/api/stores/{store_id}/departments", headers=headers)
    departments = r.json()
    department_id = departments[0]["id"]

    # Create an item without product assignment (will be in "Sonstiges")
    r = client.post(
        "/api/items",
        json={"name": "TestKiwi", "store_id": store_id},
        headers=headers,
    )
    assert r.status_code == 201
    item = r.json()
    item_id = item["id"]
    assert item["department_id"] is None  # Not assigned to department yet
    assert item["product_id"] is None  # No product yet

    # Convert item to product by assigning department
    r = client.post(
        f"/api/items/{item_id}/convert-to-product",
        json={"department_id": department_id},
        headers=headers,
    )
    assert r.status_code == 200
    updated_item = r.json()
    assert updated_item["department_id"] == department_id
    assert updated_item["product_id"] is not None
    assert updated_item["department_name"] == departments[0]["name"]

    # Verify product was created by checking store products
    product_id = updated_item["product_id"]
    r = client.get(f"/api/stores/{store_id}/products", headers=headers)
    assert r.status_code == 200
    products = r.json()
    created_product = next((p for p in products if p["id"] == product_id), None)
    assert created_product is not None
    assert created_product["name"] == "TestKiwi"
    assert created_product["department_id"] == department_id
    assert created_product["store_id"] == store_id

    # Cleanup
    client.delete(f"/api/items/{item_id}", headers=headers)
    r = client.delete(f"/api/products/{product_id}", headers=headers)
    # Product delete might return 404 if cascading delete, that's ok


def test_convert_item_to_product_existing_product():
    """Test converting item when product already exists."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Get a store and department
    r = client.get("/api/stores", headers=headers)
    stores = r.json()
    store_id = stores[0]["id"]

    r = client.get(f"/api/stores/{store_id}/departments", headers=headers)
    departments = r.json()
    department_id = departments[0]["id"]

    # Create a product first
    r = client.post(
        "/api/products",
        json={
            "name": "ExistingProduct",
            "store_id": store_id,
            "department_id": department_id,
            "fresh": False,
        },
        headers=headers,
    )
    assert r.status_code == 201
    existing_product = r.json()
    existing_product_id = existing_product["id"]

    # Create an item with the same name
    r = client.post(
        "/api/items",
        json={"name": "ExistingProduct", "store_id": store_id},
        headers=headers,
    )
    assert r.status_code == 201
    item = r.json()
    item_id = item["id"]

    # Convert item - should use existing product
    r = client.post(
        f"/api/items/{item_id}/convert-to-product",
        json={"department_id": department_id},
        headers=headers,
    )
    assert r.status_code == 200
    updated_item = r.json()
    assert updated_item["product_id"] == existing_product_id

    # Verify no new product was created
    r = client.get(f"/api/stores/{store_id}/products", headers=headers)
    products = [p for p in r.json() if p["name"] == "ExistingProduct"]
    assert len(products) == 1  # Should still be only one product

    # Cleanup
    client.delete(f"/api/items/{item_id}", headers=headers)
    client.delete(f"/api/products/{existing_product_id}", headers=headers)
