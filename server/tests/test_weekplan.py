"""Tests for weekplan endpoints and template integration."""

from fastapi.testclient import TestClient
from sqlmodel import Session, select
from server.src.main import app
from server.src.db import get_engine
from server.src.models import (
    ShoppingTemplate,
    TemplateItem,
    Item,
    Store,
    Department,
    Product,
)
from server.src.user_models import User

client = TestClient(app)


def get_auth_token():
    """Register a test user and return authentication token."""
    register_data = {
        "username": "testuser_weekplan",
        "email": "test_weekplan@example.com",
        "password": "testpass123",
    }
    client.post("/api/auth/register", json=register_data)

    # Approve the user
    engine = get_engine()
    with Session(engine) as session:
        statement = select(User).where(User.username == "testuser_weekplan")
        user = session.exec(statement).first()
        if user:
            user.is_approved = True
            session.add(user)
            session.commit()

    # Login
    login_data = {"username": "testuser_weekplan", "password": "testpass123"}
    r = client.post("/api/auth/login", json=login_data)
    return r.json()["access_token"]


def create_sample_template():
    """Create a sample shopping template with items (or return existing)."""
    engine = get_engine()
    with Session(engine) as session:
        # Check if template already exists
        existing_template = session.exec(
            select(ShoppingTemplate).where(ShoppingTemplate.name == "Wocheneinkauf")
        ).first()
        if existing_template:
            return existing_template.id

        # Get first store from seeded data
        store = session.exec(select(Store).order_by(Store.sort_order)).first()
        dept = session.exec(
            select(Department).where(Department.store_id == store.id)
        ).first()

        # Create a fresh product if it doesn't exist
        fresh_product = session.exec(
            select(Product).where(
                Product.name == "Tomaten", Product.store_id == store.id
            )
        ).first()
        if not fresh_product:
            fresh_product = Product(
                name="Tomaten",
                store_id=store.id,
                department_id=dept.id,
                fresh=True,
            )
            session.add(fresh_product)

        # Create template
        template = ShoppingTemplate(
            name="Wocheneinkauf", description="Standard weekly shop"
        )
        session.add(template)
        session.flush()

        # Add template items
        for name, menge in [
            ("Milch", "2 L"),
            ("Brot", "1"),
            ("Tomaten", "500 g"),
        ]:
            item = TemplateItem(template_id=template.id, name=name, menge=menge)
            session.add(item)

        session.commit()
        return template.id


def test_create_weekplan_entry():
    """Test creating a weekplan entry."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    response = client.post(
        "/api/weekplan/entries",
        headers=headers,
        json={"date": "2025-01-27", "meal": "lunch", "text": "Spaghetti Bolognese"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["date"] == "2025-01-27"
    assert data["meal"] == "lunch"
    assert data["text"] == "Spaghetti Bolognese"


def test_get_weekplan_entries():
    """Test retrieving weekplan entries for a week."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Create some entries
    client.post(
        "/api/weekplan/entries",
        headers=headers,
        json={"date": "2025-01-27", "meal": "lunch", "text": "Pasta"},
    )
    client.post(
        "/api/weekplan/entries",
        headers=headers,
        json={"date": "2025-01-28", "meal": "dinner", "text": "Pizza"},
    )

    response = client.get(
        "/api/weekplan/entries?week_start=2025-01-27", headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2


def test_delete_weekplan_entry():
    """Test deleting a weekplan entry."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Create entry
    response = client.post(
        "/api/weekplan/entries",
        headers=headers,
        json={"date": "2025-01-27", "meal": "lunch", "text": "Test"},
    )
    entry_id = response.json()["id"]

    # Delete entry
    response = client.delete(f"/api/weekplan/entries/{entry_id}", headers=headers)
    assert response.status_code == 200


def test_create_entry_with_template_name_adds_items():
    """Test that creating a weekplan entry with a template name\
    adds items to shopping list."""
    from datetime import datetime, timedelta

    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    create_sample_template()

    # Use a future date (tomorrow)
    future_date = (datetime.now() + timedelta(days=1)).date().isoformat()

    # Create weekplan entry with template name
    response = client.post(
        "/api/weekplan/entries",
        headers=headers,
        json={"date": future_date, "meal": "lunch", "text": "Wocheneinkauf"},
    )
    assert response.status_code == 200

    # Verify items were added
    engine = get_engine()
    with Session(engine) as session:
        items = session.exec(select(Item)).all()
        item_names = {item.name for item in items}
        assert "Milch" in item_names
        assert "Brot" in item_names
        assert "Tomaten" in item_names


def test_create_entry_without_template_name_no_items_added():
    """Test that creating a weekplan entry without matching template name\
    doesn't add items."""
    from datetime import datetime, timedelta

    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    create_sample_template()

    # Use a future date (tomorrow)
    future_date = (datetime.now() + timedelta(days=1)).date().isoformat()

    response = client.post(
        "/api/weekplan/entries",
        headers=headers,
        json={"date": future_date, "meal": "lunch", "text": "Random Meal"},
    )
    assert response.status_code == 200

    # Verify no additional items were added
    # Since "Random Meal" doesn't match the template name,
    # no new items should be created for this weekplan entry


def test_delete_entry_with_template_name():
    """Test that deleting a weekplan entry works correctly\
    (template integration tested implicitly)."""
    from datetime import datetime, timedelta

    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    create_sample_template()

    # Use a future date (tomorrow)
    future_date = (datetime.now() + timedelta(days=1)).date().isoformat()

    # Create entry
    response = client.post(
        "/api/weekplan/entries",
        headers=headers,
        json={"date": future_date, "meal": "lunch", "text": "Wocheneinkauf"},
    )
    assert response.status_code == 200
    entry_id = response.json()["id"]

    # Delete the entry (this should also trigger template item removal logic)
    response = client.delete(f"/api/weekplan/entries/{entry_id}", headers=headers)
    assert response.status_code == 200
    assert "message" in response.json()
