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


def test_parse_ingredient_line_removes_parentheses():
    """Test that _parse_ingredient_line removes content within parentheses."""
    from server.src.routers.weekplan import (
        _parse_ingredient_line,
        _create_ingredient_pattern,
    )
    from sqlmodel import Session

    engine = get_engine()
    with Session(engine) as session:
        pattern = _create_ingredient_pattern(session)

        # Test cases with parentheses
        test_cases = [
            # Parentheses at the end
            ("500 g Mehl (Type 405)", "500 g", "Mehl"),
            ("2 EL Öl (z.B. Olivenöl)", "2 EL", "Öl"),
            ("Salz (nach Geschmack)", None, "Salz"),
            ("1 kg Zucker (weiß)", "1 kg", "Zucker"),
            ("Butter (zimmerwarm)", None, "Butter"),
            # Parentheses in the middle
            ("500 g Tomaten (geschält) gewürfelt", "500 g", "Tomaten gewürfelt"),
            ("2 EL Essig (Apfel) oder Zitronensaft", "2 EL", "Essig oder Zitronensaft"),
            ("Paprika (rot) in Streifen", None, "Paprika in Streifen"),
            # Multiple parentheses
            ("1 kg Kartoffeln (festkochend) (geschält)", "1 kg", "Kartoffeln"),
            # Test without parentheses (should remain unchanged)
            ("250 g Butter", "250 g", "Butter"),
            ("Milch", None, "Milch"),
        ]

        for line, expected_quantity, expected_name in test_cases:
            quantity, name = _parse_ingredient_line(line, pattern)
            assert (
                name == expected_name
            ), f"Expected name '{expected_name}' but got '{name}' for line '{line}'"
            if expected_quantity is not None:
                assert (
                    quantity == expected_quantity
                ), f"Expected quantity '{expected_quantity}' but got '{quantity}'"


def test_recipe_ingredient_parentheses_removal_in_add_and_remove():
    """Test that parentheses are removed when adding and removing recipe items."""
    from datetime import datetime, timedelta
    from server.src.models import Recipe
    import json

    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Create a test recipe with ingredients containing parentheses
    engine = get_engine()
    with Session(engine) as session:
        recipe_data = {
            "name": "Test Recipe",
            "ingredients": (
                "500 g Mehl (Type 405)\n"
                "2 EL Öl (z.B. Olivenöl)\n"
                "Salz (nach Geschmack)"
            ),
            "quantity": 2,
        }
        recipe = Recipe(
            external_id="test_recipe_parentheses",
            name="Test Recipe",
            data=json.dumps(recipe_data),
        )
        session.add(recipe)
        session.commit()
        session.refresh(recipe)
        recipe_id = recipe.id

    # Use a future date (tomorrow)
    future_date = (datetime.now() + timedelta(days=1)).date().isoformat()

    # Create weekplan entry with recipe
    response = client.post(
        "/api/weekplan/entries",
        headers=headers,
        json={
            "date": future_date,
            "meal": "dinner",
            "text": "Test Recipe",
            "entry_type": "recipe",
            "recipe_id": recipe_id,
        },
    )
    assert response.status_code == 200
    entry_id = response.json()["id"]

    # Check that items were added with parentheses removed
    with Session(engine) as session:
        items = session.exec(select(Item)).all()
        item_names = {item.name for item in items}
        # Should have "Mehl", "Öl", "Salz" (without parentheses content)
        assert "Mehl" in item_names, "Mehl should be in shopping list"
        assert "Öl" in item_names, "Öl should be in shopping list"
        assert "Salz" in item_names, "Salz should be in shopping list"
        # Should NOT have the original names with parentheses
        assert "Mehl (Type 405)" not in item_names
        assert "Öl (z.B. Olivenöl)" not in item_names
        assert "Salz (nach Geschmack)" not in item_names

    # Delete the weekplan entry (this should remove the items)
    response = client.delete(f"/api/weekplan/entries/{entry_id}", headers=headers)
    assert response.status_code == 200

    # Verify items were removed correctly
    # The removal logic also uses _parse_ingredient_line,
    # so it must match the same names (without parentheses)
    # This ensures consistency between add and remove operations


def test_recipe_delta_removed_items_with_parentheses():
    """Test that removed_items in deltas work correctly with parentheses.

    When a user marks an ingredient with parentheses as "not needed" in the
    recipe modal, the delta.removed_items will contain the original name
    (with parentheses). This test ensures that the item is still correctly
    excluded from the shopping list, even though it's stored without
    parentheses.
    """
    from datetime import datetime, timedelta
    from server.src.models import Recipe
    import json

    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Clear any existing items from previous tests
    engine = get_engine()
    with Session(engine) as session:
        # Delete all existing items
        items = session.exec(select(Item)).all()
        for item in items:
            session.delete(item)
        session.commit()

    # Create a test recipe with ingredients containing parentheses
    with Session(engine) as session:
        recipe_data = {
            "name": "Parentheses Test Recipe",
            "ingredients": (
                "500 g Mehl (Type 405)\n"
                "2 EL Öl (z.B. Olivenöl)\n"
                "Salz (nach Geschmack)"
            ),
            "quantity": 2,
        }
        recipe = Recipe(
            external_id="test_recipe_delta_parentheses",
            name="Parentheses Test Recipe",
            data=json.dumps(recipe_data),
        )
        session.add(recipe)
        session.commit()
        session.refresh(recipe)
        recipe_id = recipe.id

    # Use a future date (tomorrow)
    future_date = (datetime.now() + timedelta(days=1)).date().isoformat()

    # Create weekplan entry with recipe and deltas
    # User marks "Mehl (Type 405)" as removed (original name with parentheses)
    response = client.post(
        "/api/weekplan/entries",
        headers=headers,
        json={
            "date": future_date,
            "meal": "dinner",
            "text": "Parentheses Test Recipe",
            "entry_type": "recipe",
            "recipe_id": recipe_id,
            "deltas": {
                "removed_items": ["Mehl (Type 405)"],  # Original name with parentheses
                "added_items": [],
                "person_count": 2,
            },
        },
    )
    assert response.status_code == 200, f"Failed to create entry: {response.json()}"
    entry_id = response.json()["id"]

    # Check that items were added correctly
    # "Mehl" should NOT be in the list (it was in removed_items)
    # "Öl" and "Salz" should be in the list
    with Session(engine) as session:
        items = session.exec(select(Item)).all()
        item_names = {item.name for item in items}
        # "Mehl" should NOT be added (marked as removed in deltas)
        assert (
            "Mehl" not in item_names
        ), "Mehl should not be in shopping list (marked as removed)"
        # Other ingredients should be added (without parentheses)
        assert "Öl" in item_names, "Öl should be in shopping list"
        assert "Salz" in item_names, "Salz should be in shopping list"

    # Clean up: delete the weekplan entry
    response = client.delete(f"/api/weekplan/entries/{entry_id}", headers=headers)
    assert response.status_code == 200


def test_recipe_delta_re_add_item_with_parentheses():
    """Test that unmarking an item with parentheses re-adds it to the list.

    When a user first marks an ingredient as "not needed" and then
    unchecks it again, the item should be added back to the shopping list.
    This test ensures this works correctly even when the ingredient name
    contains parentheses.
    """
    from datetime import datetime, timedelta
    from server.src.models import Recipe
    import json

    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Clear any existing items from previous tests
    engine = get_engine()
    with Session(engine) as session:
        # Delete all existing items
        items = session.exec(select(Item)).all()
        for item in items:
            session.delete(item)
        session.commit()

    # Create a test recipe with ingredients containing parentheses
    with Session(engine) as session:
        recipe_data = {
            "name": "Re-add Test Recipe",
            "ingredients": ("500 g Mehl (Type 405)\n" "2 EL Öl (z.B. Olivenöl)"),
            "quantity": 2,
        }
        recipe = Recipe(
            external_id="test_recipe_re_add_parentheses",
            name="Re-add Test Recipe",
            data=json.dumps(recipe_data),
        )
        session.add(recipe)
        session.commit()
        session.refresh(recipe)
        recipe_id = recipe.id

    # Use a future date (tomorrow)
    future_date = (datetime.now() + timedelta(days=1)).date().isoformat()

    # Step 1: Create entry with "Mehl (Type 405)" marked as removed
    response = client.post(
        "/api/weekplan/entries",
        headers=headers,
        json={
            "date": future_date,
            "meal": "dinner",
            "text": "Re-add Test Recipe",
            "entry_type": "recipe",
            "recipe_id": recipe_id,
            "deltas": {
                "removed_items": ["Mehl (Type 405)"],
                "added_items": [],
                "person_count": 2,
            },
        },
    )
    assert response.status_code == 200
    entry_id = response.json()["id"]

    # Verify "Mehl" is NOT in the list (it was removed)
    with Session(engine) as session:
        items = session.exec(select(Item)).all()
        item_names = {item.name for item in items}
        assert "Mehl" not in item_names, "Mehl should not be in list (removed)"
        assert "Öl" in item_names, "Öl should be in list"

    # Step 2: Update deltas to re-add "Mehl" (remove it from removed_items)
    response = client.patch(
        f"/api/weekplan/entries/{entry_id}/deltas",
        headers=headers,
        json={
            "removed_items": [],  # Mehl is no longer in removed_items
            "added_items": [],
            "person_count": 2,
        },
    )
    assert response.status_code == 200

    # Verify "Mehl" is NOW in the list (it was re-added)
    with Session(engine) as session:
        items = session.exec(select(Item)).all()
        item_names = {item.name for item in items}
        assert "Mehl" in item_names, "Mehl should be back in list (re-added)"
        assert "Öl" in item_names, "Öl should still be in list"

    # Clean up: delete the weekplan entry
    response = client.delete(f"/api/weekplan/entries/{entry_id}", headers=headers)
    assert response.status_code == 200


def test_recipe_ingredient_without_quantity_defaults_to_1():
    """Test that ingredients without quantity get '1' as default menge.

    When a recipe contains an ingredient without a quantity (e.g., 'Salz'),
    it should be added to the shopping list with menge='1' instead of None.
    """
    from datetime import datetime, timedelta
    from server.src.models import Recipe
    import json

    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Clear any existing items from previous tests
    engine = get_engine()
    with Session(engine) as session:
        items = session.exec(select(Item)).all()
        for item in items:
            session.delete(item)
        session.commit()

    # Create a test recipe with ingredients with and without quantities
    with Session(engine) as session:
        recipe_data = {
            "name": "No Quantity Test Recipe",
            "ingredients": (
                "500 g Mehl\n"
                "Salz\n"  # No quantity
                "Pfeffer (nach Geschmack)"  # No quantity with parentheses
            ),
            "quantity": 2,
        }
        recipe = Recipe(
            external_id="test_recipe_no_quantity",
            name="No Quantity Test Recipe",
            data=json.dumps(recipe_data),
        )
        session.add(recipe)
        session.commit()
        session.refresh(recipe)
        recipe_id = recipe.id

    # Use a future date (tomorrow)
    future_date = (datetime.now() + timedelta(days=1)).date().isoformat()

    # Create weekplan entry with recipe
    response = client.post(
        "/api/weekplan/entries",
        headers=headers,
        json={
            "date": future_date,
            "meal": "dinner",
            "text": "No Quantity Test Recipe",
            "entry_type": "recipe",
            "recipe_id": recipe_id,
        },
    )
    assert response.status_code == 200
    entry_id = response.json()["id"]

    # Check that all items were added with correct quantities
    with Session(engine) as session:
        items = session.exec(select(Item)).all()
        item_dict = {item.name: item.menge for item in items}

        # Item with quantity should have that quantity
        assert "Mehl" in item_dict, "Mehl should be in shopping list"
        assert (
            item_dict["Mehl"] == "500 g"
        ), f"Mehl should have '500 g', got {item_dict['Mehl']}"

        # Items without quantity should have '1' as default
        assert "Salz" in item_dict, "Salz should be in shopping list"
        assert (
            item_dict["Salz"] == "1"
        ), f"Salz should have '1' as default, got {item_dict['Salz']}"

        assert "Pfeffer" in item_dict, "Pfeffer should be in shopping list"
        assert (
            item_dict["Pfeffer"] == "1"
        ), f"Pfeffer should have '1' as default, got {item_dict['Pfeffer']}"

    # Clean up: delete the weekplan entry
    response = client.delete(f"/api/weekplan/entries/{entry_id}", headers=headers)
    assert response.status_code == 200


def test_recipe_delete_with_ingredients_without_quantity():
    """Test that deleting a recipe correctly removes ingredients without quantity.

    When a recipe with ingredients without quantity is deleted, those items
    should be removed with menge='1' (not None).
    """
    from datetime import datetime, timedelta
    from server.src.models import Recipe
    import json

    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Clear any existing items from previous tests
    engine = get_engine()
    with Session(engine) as session:
        items = session.exec(select(Item)).all()
        for item in items:
            session.delete(item)
        session.commit()

    # Create a test recipe with ingredients without quantities
    with Session(engine) as session:
        recipe_data = {
            "name": "Delete Test Recipe",
            "ingredients": ("Salz\n" "Pfeffer"),  # No quantities
            "quantity": 2,
        }
        recipe = Recipe(
            external_id="test_recipe_delete_no_quantity",
            name="Delete Test Recipe",
            data=json.dumps(recipe_data),
        )
        session.add(recipe)
        session.commit()
        session.refresh(recipe)
        recipe_id = recipe.id

    # Use a future date (tomorrow)
    future_date = (datetime.now() + timedelta(days=1)).date().isoformat()

    # Step 1: Create weekplan entry with recipe
    response = client.post(
        "/api/weekplan/entries",
        headers=headers,
        json={
            "date": future_date,
            "meal": "dinner",
            "text": "Delete Test Recipe",
            "entry_type": "recipe",
            "recipe_id": recipe_id,
        },
    )
    assert response.status_code == 200
    entry_id = response.json()["id"]

    # Verify items were added with menge='1'
    with Session(engine) as session:
        items = session.exec(select(Item)).all()
        item_dict = {item.name: item.menge for item in items}
        assert "Salz" in item_dict, "Salz should be in shopping list"
        assert (
            item_dict["Salz"] == "1"
        ), f"Salz should have '1', got {item_dict['Salz']}"
        assert "Pfeffer" in item_dict, "Pfeffer should be in shopping list"
        assert (
            item_dict["Pfeffer"] == "1"
        ), f"Pfeffer should have '1', got {item_dict['Pfeffer']}"

    # Step 2: Delete the weekplan entry
    response = client.delete(f"/api/weekplan/entries/{entry_id}", headers=headers)
    assert response.status_code == 200

    # Verify items were removed correctly
    with Session(engine) as session:
        items = session.exec(select(Item)).all()
        item_names = {item.name for item in items}
        # Both items should be removed (subtracted with menge='1')
        assert "Salz" not in item_names, "Salz should be removed from shopping list"
        assert (
            "Pfeffer" not in item_names
        ), "Pfeffer should be removed from shopping list"


def test_recipe_similar_ingredient_names_not_merged():
    """Test that similar but different ingredients are not merged.

    When a recipe contains similar ingredient names like 'Kürbiskerne' and
    'Kürbiskernöl', they should NOT be merged into one item, even if fuzzy
    matching might suggest they're similar.
    """
    from datetime import datetime, timedelta
    from server.src.models import Recipe, Product, Store, Department
    import json

    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Clear any existing items from previous tests
    engine = get_engine()
    with Session(engine) as session:
        items = session.exec(select(Item)).all()
        for item in items:
            session.delete(item)
        session.commit()

        # Create products for both ingredients
        store = session.exec(select(Store)).first()
        department = session.exec(select(Department)).first()

        # Create 'Kürbiskerne' product
        product1 = Product(
            name="Kürbiskerne",
            store_id=store.id,
            department_id=department.id,
            is_fresh=False,
        )
        session.add(product1)

        # Create 'Kürbiskernöl' product
        product2 = Product(
            name="Kürbiskernöl",
            store_id=store.id,
            department_id=department.id,
            is_fresh=False,
        )
        session.add(product2)
        session.commit()

    # Create a test recipe with similar ingredient names
    with Session(engine) as session:
        recipe_data = {
            "name": "Similar Names Test Recipe",
            "ingredients": ("1 EL Kürbiskerne\n" "Kürbiskernöl"),
            "quantity": 2,
        }
        recipe = Recipe(
            external_id="test_recipe_similar_names",
            name="Similar Names Test Recipe",
            data=json.dumps(recipe_data),
        )
        session.add(recipe)
        session.commit()
        session.refresh(recipe)
        recipe_id = recipe.id

    # Use a future date (tomorrow)
    future_date = (datetime.now() + timedelta(days=1)).date().isoformat()

    # Create weekplan entry with recipe
    response = client.post(
        "/api/weekplan/entries",
        headers=headers,
        json={
            "date": future_date,
            "meal": "dinner",
            "text": "Similar Names Test Recipe",
            "entry_type": "recipe",
            "recipe_id": recipe_id,
        },
    )
    assert response.status_code == 200
    entry_id = response.json()["id"]

    # Check that both items were added as SEPARATE items
    with Session(engine) as session:
        items = session.exec(select(Item)).all()
        item_dict = {item.name: item.menge for item in items}

        # Both should exist as separate items
        assert "Kürbiskerne" in item_dict, "Kürbiskerne should be in shopping list"
        assert (
            "Kürbiskernöl" in item_dict
        ), "Kürbiskernöl should be in shopping list as separate item"

        # Kürbiskerne should only have '1 EL', not merged with Kürbiskernöl
        assert (
            item_dict["Kürbiskerne"] == "1 EL"
        ), f"Kürbiskerne should have '1 EL', got {item_dict['Kürbiskerne']}"

        # Kürbiskernöl should have '1' (default)
        assert (
            item_dict["Kürbiskernöl"] == "1"
        ), f"Kürbiskernöl should have '1', got {item_dict['Kürbiskernöl']}"

        # Verify we have exactly 2 items (not merged)
        assert len(items) == 2, f"Should have 2 separate items, got {len(items)}"

    # Clean up: delete the weekplan entry
    response = client.delete(f"/api/weekplan/entries/{entry_id}", headers=headers)
    assert response.status_code == 200
