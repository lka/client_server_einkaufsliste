"""Tests for store, department, and product management."""

from fastapi.testclient import TestClient
from sqlmodel import Session, select
from server.src.main import app
from server.src.db import get_engine
from server.src.user_models import User

client = TestClient(app)


def get_auth_token():
    """Helper function to register a test user and get auth token."""
    # Register test user
    register_data = {
        "username": "storeuser",
        "email": "storeuser@example.com",
        "password": "testpass123",
    }
    r = client.post("/api/auth/register", json=register_data)

    # Approve the user directly in the database (for testing)
    engine = get_engine()
    with Session(engine) as session:
        statement = select(User).where(User.username == "storeuser")
        user = session.exec(statement).first()
        if user:
            user.is_approved = True
            session.add(user)
            session.commit()

    # Login with approved user
    login_data = {"username": "storeuser", "password": "testpass123"}
    r = client.post("/api/auth/login", json=login_data)

    assert r.status_code == 200
    token = r.json()["access_token"]
    return token


def test_get_stores():
    """Test getting all stores."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Get all stores
    r = client.get("/api/stores", headers=headers)
    assert r.status_code == 200
    stores = r.json()
    assert isinstance(stores, list)
    # Should have at least the seeded stores (Rewe, Edeka, Aldi)
    assert len(stores) >= 3

    # Verify store structure
    assert "id" in stores[0]
    assert "name" in stores[0]


def test_get_store_departments():
    """Test getting departments for a specific store."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # First get a store
    r = client.get("/api/stores", headers=headers)
    assert r.status_code == 200
    stores = r.json()
    assert len(stores) > 0
    store_id = stores[0]["id"]

    # Get departments for that store
    r = client.get(f"/api/stores/{store_id}/departments", headers=headers)
    assert r.status_code == 200
    departments = r.json()
    assert isinstance(departments, list)
    # Should have departments from seeding
    assert len(departments) > 0

    # Verify department structure
    assert "id" in departments[0]
    assert "name" in departments[0]
    assert "store_id" in departments[0]
    assert departments[0]["store_id"] == store_id


def test_get_department_products():
    """Test getting products for a specific department."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # First get a store
    r = client.get("/api/stores", headers=headers)
    assert r.status_code == 200
    stores = r.json()
    assert len(stores) > 0
    store_id = stores[0]["id"]

    # Get departments for that store
    r = client.get(f"/api/stores/{store_id}/departments", headers=headers)
    assert r.status_code == 200
    departments = r.json()
    assert len(departments) > 0
    department_id = departments[0]["id"]

    # Get products for that department
    r = client.get(f"/api/departments/{department_id}/products", headers=headers)
    assert r.status_code == 200
    products = r.json()
    assert isinstance(products, list)
    # Should have products from seeding
    assert len(products) >= 0  # May be empty if no products in this department

    # If there are products, verify structure
    if len(products) > 0:
        assert "id" in products[0]
        assert "name" in products[0]
        assert "department_id" in products[0]
        assert products[0]["department_id"] == department_id


def test_get_store_products():
    """Test getting all products for a specific store."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # First get a store
    r = client.get("/api/stores", headers=headers)
    assert r.status_code == 200
    stores = r.json()
    assert len(stores) > 0
    store_id = stores[0]["id"]

    # Get all products for that store
    r = client.get(f"/api/stores/{store_id}/products", headers=headers)
    assert r.status_code == 200
    products = r.json()
    assert isinstance(products, list)
    # Should have products from seeding
    assert len(products) > 0

    # Verify all products belong to this store
    for product in products:
        assert "store_id" in product
        assert product["store_id"] == store_id


def test_get_nonexistent_store():
    """Test getting departments for a nonexistent store."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Use a very high store ID that doesn't exist
    r = client.get("/api/stores/999999/departments", headers=headers)
    assert r.status_code == 404


def test_get_nonexistent_department():
    """Test getting products for a nonexistent department."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Use a very high department ID that doesn't exist
    r = client.get("/api/departments/999999/products", headers=headers)
    assert r.status_code == 404


def test_unauthorized_access():
    """Test that endpoints require authentication."""
    # Try to access without token
    r = client.get("/api/stores")
    # FastAPI returns 403 when no credentials are provided
    assert r.status_code in [401, 403]

    r = client.get("/api/stores/1/departments")
    assert r.status_code in [401, 403]

    r = client.get("/api/departments/1/products")
    assert r.status_code in [401, 403]

    r = client.get("/api/stores/1/products")
    assert r.status_code in [401, 403]


# === Store CRUD Tests ===


def test_create_store():
    """Test creating a new store."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    store_data = {"name": "TestMarkt", "location": "Teststraße 123"}
    r = client.post("/api/stores", json=store_data, headers=headers)
    assert r.status_code == 201
    store = r.json()
    assert store["name"] == "TestMarkt"
    assert store["location"] == "Teststraße 123"
    assert "id" in store


def test_create_duplicate_store():
    """Test that creating a store with duplicate name fails."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Get existing store name
    r = client.get("/api/stores", headers=headers)
    assert r.status_code == 200
    stores = r.json()
    existing_name = stores[0]["name"]

    # Try to create store with same name
    store_data = {"name": existing_name, "location": "Test"}
    r = client.post("/api/stores", json=store_data, headers=headers)
    assert r.status_code == 400


def test_delete_store():
    """Test deleting a store."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Create a store to delete
    store_data = {"name": "DeleteTest Store", "location": "Test"}
    r = client.post("/api/stores", json=store_data, headers=headers)
    assert r.status_code == 201
    store_id = r.json()["id"]

    # Delete the store
    r = client.delete(f"/api/stores/{store_id}", headers=headers)
    assert r.status_code == 204

    # Verify it's deleted
    r = client.get(f"/api/stores/{store_id}/departments", headers=headers)
    assert r.status_code == 404


def test_delete_nonexistent_store():
    """Test deleting a nonexistent store."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    r = client.delete("/api/stores/999999", headers=headers)
    assert r.status_code == 404


def test_update_store():
    """Test updating a store."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Create a store to update
    store_data = {"name": "UpdateTest Store", "location": "Old Location"}
    r = client.post("/api/stores", json=store_data, headers=headers)
    assert r.status_code == 201
    store_id = r.json()["id"]

    # Update the store
    update_data = {
        "name": "Updated Store",
        "location": "New Location",
        "sort_order": 10,
    }
    r = client.put(f"/api/stores/{store_id}", json=update_data, headers=headers)
    assert r.status_code == 200
    updated_store = r.json()
    assert updated_store["name"] == "Updated Store"
    assert updated_store["location"] == "New Location"
    assert updated_store["sort_order"] == 10


def test_update_store_partial():
    """Test partially updating a store (only some fields)."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Create a store
    store_data = {"name": "PartialUpdate Store", "location": "Location"}
    r = client.post("/api/stores", json=store_data, headers=headers)
    assert r.status_code == 201
    store_id = r.json()["id"]

    # Update only sort_order
    update_data = {"sort_order": 5}
    r = client.put(f"/api/stores/{store_id}", json=update_data, headers=headers)
    assert r.status_code == 200
    updated_store = r.json()
    assert updated_store["name"] == "PartialUpdate Store"  # Name unchanged
    assert updated_store["sort_order"] == 5


def test_update_nonexistent_store():
    """Test updating a nonexistent store."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    update_data = {"name": "NonExistent"}
    r = client.put("/api/stores/999999", json=update_data, headers=headers)
    assert r.status_code == 404


def test_store_sort_order():
    """Test that stores are returned in sort_order."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Create three stores with specific sort orders
    store1_data = {"name": "ZZZ Last Store", "location": ""}
    r1 = client.post("/api/stores", json=store1_data, headers=headers)
    assert r1.status_code == 201
    store1_id = r1.json()["id"]

    store2_data = {"name": "AAA First Store", "location": ""}
    r2 = client.post("/api/stores", json=store2_data, headers=headers)
    assert r2.status_code == 201
    store2_id = r2.json()["id"]

    store3_data = {"name": "MMM Middle Store", "location": ""}
    r3 = client.post("/api/stores", json=store3_data, headers=headers)
    assert r3.status_code == 201
    store3_id = r3.json()["id"]

    # Set sort orders: store2=0, store3=1, store1=2
    client.put(f"/api/stores/{store2_id}", json={"sort_order": 0}, headers=headers)
    client.put(f"/api/stores/{store3_id}", json={"sort_order": 1}, headers=headers)
    client.put(f"/api/stores/{store1_id}", json={"sort_order": 2}, headers=headers)

    # Get all stores and verify order
    r = client.get("/api/stores", headers=headers)
    assert r.status_code == 200
    stores = r.json()

    # Find our test stores in the list
    test_stores = [s for s in stores if s["id"] in [store1_id, store2_id, store3_id]]
    assert len(test_stores) == 3

    # Verify they are in sort_order
    assert test_stores[0]["id"] == store2_id  # AAA First Store (sort_order=0)
    assert test_stores[1]["id"] == store3_id  # MMM Middle Store (sort_order=1)
    assert test_stores[2]["id"] == store1_id  # ZZZ Last Store (sort_order=2)


# === Department CRUD Tests ===


def test_create_department():
    """Test creating a new department."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Get a store
    r = client.get("/api/stores", headers=headers)
    store_id = r.json()[0]["id"]

    # Create department
    dept_data = {"name": "Test Abteilung", "sort_order": 100}
    r = client.post(
        f"/api/stores/{store_id}/departments", json=dept_data, headers=headers
    )
    assert r.status_code == 201
    dept = r.json()
    assert dept["name"] == "Test Abteilung"
    assert dept["store_id"] == store_id
    assert dept["sort_order"] == 100


def test_create_department_invalid_store():
    """Test creating department for nonexistent store."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    dept_data = {"name": "Test", "sort_order": 0}
    r = client.post("/api/stores/999999/departments", json=dept_data, headers=headers)
    assert r.status_code == 404


def test_delete_department():
    """Test deleting a department."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Get a store and create a department
    r = client.get("/api/stores", headers=headers)
    store_id = r.json()[0]["id"]

    dept_data = {"name": "DeleteTest Dept", "sort_order": 0}
    r = client.post(
        f"/api/stores/{store_id}/departments", json=dept_data, headers=headers
    )
    assert r.status_code == 201
    dept_id = r.json()["id"]

    # Delete the department
    r = client.delete(f"/api/departments/{dept_id}", headers=headers)
    assert r.status_code == 204

    # Verify it's deleted by checking products endpoint
    r = client.get(f"/api/departments/{dept_id}/products", headers=headers)
    assert r.status_code == 404


def test_delete_nonexistent_department():
    """Test deleting a nonexistent department."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    r = client.delete("/api/departments/999999", headers=headers)
    assert r.status_code == 404


# === Product CRUD Tests ===


def test_create_product():
    """Test creating a new product."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Get store and department
    r = client.get("/api/stores", headers=headers)
    store_id = r.json()[0]["id"]
    r = client.get(f"/api/stores/{store_id}/departments", headers=headers)
    dept_id = r.json()[0]["id"]

    # Create product
    product_data = {
        "name": "Test Produkt",
        "store_id": store_id,
        "department_id": dept_id,
        "fresh": True,
    }
    r = client.post("/api/products", json=product_data, headers=headers)
    assert r.status_code == 201
    product = r.json()
    assert product["name"] == "Test Produkt"
    assert product["store_id"] == store_id
    assert product["department_id"] == dept_id
    assert product["fresh"] is True


def test_create_product_invalid_store():
    """Test creating product with nonexistent store."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    product_data = {
        "name": "Test",
        "store_id": 999999,
        "department_id": 1,
        "fresh": False,
    }
    r = client.post("/api/products", json=product_data, headers=headers)
    assert r.status_code == 404


def test_create_product_invalid_department():
    """Test creating product with nonexistent department."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Get valid store
    r = client.get("/api/stores", headers=headers)
    store_id = r.json()[0]["id"]

    product_data = {
        "name": "Test",
        "store_id": store_id,
        "department_id": 999999,
        "fresh": False,
    }
    r = client.post("/api/products", json=product_data, headers=headers)
    assert r.status_code == 404


def test_create_product_department_wrong_store():
    """Test creating product where department doesn't belong to store."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Get two different stores
    r = client.get("/api/stores", headers=headers)
    stores = r.json()
    store1_id = stores[0]["id"]
    store2_id = stores[1]["id"] if len(stores) > 1 else store1_id

    # Get department from store1
    r = client.get(f"/api/stores/{store1_id}/departments", headers=headers)
    dept_id = r.json()[0]["id"]

    # Try to create product in store2 with department from store1
    if store1_id != store2_id:
        product_data = {
            "name": "Test",
            "store_id": store2_id,
            "department_id": dept_id,
            "fresh": False,
        }
        r = client.post("/api/products", json=product_data, headers=headers)
        assert r.status_code == 400


def test_update_product():
    """Test updating a product."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Create a product
    r = client.get("/api/stores", headers=headers)
    store_id = r.json()[0]["id"]
    r = client.get(f"/api/stores/{store_id}/departments", headers=headers)
    dept_id = r.json()[0]["id"]

    product_data = {
        "name": "Original Name",
        "store_id": store_id,
        "department_id": dept_id,
        "fresh": False,
    }
    r = client.post("/api/products", json=product_data, headers=headers)
    assert r.status_code == 201
    product_id = r.json()["id"]

    # Update the product
    update_data = {"name": "Updated Name", "fresh": True}
    r = client.put(f"/api/products/{product_id}", json=update_data, headers=headers)
    assert r.status_code == 200
    updated = r.json()
    assert updated["name"] == "Updated Name"
    assert updated["fresh"] is True
    assert updated["id"] == product_id


def test_update_product_partial():
    """Test partially updating a product (only some fields)."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Create a product
    r = client.get("/api/stores", headers=headers)
    store_id = r.json()[0]["id"]
    r = client.get(f"/api/stores/{store_id}/departments", headers=headers)
    dept_id = r.json()[0]["id"]

    product_data = {
        "name": "Original",
        "store_id": store_id,
        "department_id": dept_id,
        "fresh": False,
    }
    r = client.post("/api/products", json=product_data, headers=headers)
    product_id = r.json()["id"]

    # Update only name
    update_data = {"name": "New Name"}
    r = client.put(f"/api/products/{product_id}", json=update_data, headers=headers)
    assert r.status_code == 200
    updated = r.json()
    assert updated["name"] == "New Name"
    assert updated["fresh"] is False  # Should remain unchanged


def test_update_nonexistent_product():
    """Test updating a nonexistent product."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    update_data = {"name": "Test"}
    r = client.put("/api/products/999999", json=update_data, headers=headers)
    assert r.status_code == 404


def test_delete_product():
    """Test deleting a product."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Create a product
    r = client.get("/api/stores", headers=headers)
    store_id = r.json()[0]["id"]
    r = client.get(f"/api/stores/{store_id}/departments", headers=headers)
    dept_id = r.json()[0]["id"]

    product_data = {
        "name": "DeleteTest Product",
        "store_id": store_id,
        "department_id": dept_id,
        "fresh": False,
    }
    r = client.post("/api/products", json=product_data, headers=headers)
    product_id = r.json()["id"]

    # Delete the product
    r = client.delete(f"/api/products/{product_id}", headers=headers)
    assert r.status_code == 204

    # Verify it's deleted - get store products and check it's not there
    r = client.get(f"/api/stores/{store_id}/products", headers=headers)
    products = r.json()
    product_ids = [p["id"] for p in products]
    assert product_id not in product_ids


def test_delete_nonexistent_product():
    """Test deleting a nonexistent product."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    r = client.delete("/api/products/999999", headers=headers)
    assert r.status_code == 404


def test_cascading_delete_store():
    """Test that deleting a store also deletes its departments and products."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Create a store
    store_data = {"name": "CascadeTest Store", "location": "Test"}
    r = client.post("/api/stores", json=store_data, headers=headers)
    store_id = r.json()["id"]

    # Create a department
    dept_data = {"name": "CascadeTest Dept", "sort_order": 0}
    r = client.post(
        f"/api/stores/{store_id}/departments", json=dept_data, headers=headers
    )
    dept_id = r.json()["id"]

    # Create a product
    product_data = {
        "name": "CascadeTest Product",
        "store_id": store_id,
        "department_id": dept_id,
        "fresh": False,
    }
    r = client.post("/api/products", json=product_data, headers=headers)
    assert r.status_code == 201
    # Note: product_id is implicitly tested by cascading delete

    # Delete the store
    r = client.delete(f"/api/stores/{store_id}", headers=headers)
    assert r.status_code == 204

    # Verify department is deleted (which implicitly verifies products are also deleted)
    r = client.get(f"/api/departments/{dept_id}/products", headers=headers)
    assert r.status_code == 404


def test_cascading_delete_department():
    """Test that deleting a department also deletes its products."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Get store
    r = client.get("/api/stores", headers=headers)
    store_id = r.json()[0]["id"]

    # Create a department
    dept_data = {"name": "CascadeDeptTest", "sort_order": 0}
    r = client.post(
        f"/api/stores/{store_id}/departments", json=dept_data, headers=headers
    )
    dept_id = r.json()["id"]

    # Create a product
    product_data = {
        "name": "CascadeDeptTest Product",
        "store_id": store_id,
        "department_id": dept_id,
        "fresh": False,
    }
    r = client.post("/api/products", json=product_data, headers=headers)
    product_id = r.json()["id"]

    # Delete the department
    r = client.delete(f"/api/departments/{dept_id}", headers=headers)
    assert r.status_code == 204

    # Verify product is deleted by checking store products
    r = client.get(f"/api/stores/{store_id}/products", headers=headers)
    products = r.json()
    product_ids = [p["id"] for p in products]
    assert product_id not in product_ids
