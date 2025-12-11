"""Seed data for stores, departments, and products.

This module provides initial data for German supermarkets with typical
departments and common products.
"""

from sqlmodel import Session, select
from .models import Store, Department, Product, Unit
from .db import get_engine, get_session


def seed_stores_and_departments(session: Session) -> dict[str, dict]:
    """Create stores and their departments.

    Args:
        session: Database session

    Returns:
        Dictionary mapping store names to their department data
    """
    stores_data = {}

    # Create Rewe
    rewe = Store(name="Rewe", location="")
    session.add(rewe)
    session.commit()
    session.refresh(rewe)

    rewe_departments = [
        Department(name="Obst & Gemüse", store_id=rewe.id, sort_order=1),
        Department(name="Backwaren", store_id=rewe.id, sort_order=2),
        Department(name="Fleisch & Wurst", store_id=rewe.id, sort_order=3),
        Department(name="Milchprodukte", store_id=rewe.id, sort_order=4),
        Department(name="Tiefkühl", store_id=rewe.id, sort_order=5),
        Department(name="Getränke", store_id=rewe.id, sort_order=6),
        Department(name="Konserven & Haltbares", store_id=rewe.id, sort_order=7),
        Department(name="Süßigkeiten & Snacks", store_id=rewe.id, sort_order=8),
        Department(name="Drogerie & Haushalt", store_id=rewe.id, sort_order=9),
    ]
    for dept in rewe_departments:
        session.add(dept)
    session.commit()
    for dept in rewe_departments:
        session.refresh(dept)

    stores_data["Rewe"] = {
        "store": rewe,
        "departments": {dept.name: dept for dept in rewe_departments},
    }

    # Create Edeka
    edeka = Store(name="Edeka", location="")
    session.add(edeka)
    session.commit()
    session.refresh(edeka)

    edeka_departments = [
        Department(name="Obst & Gemüse", store_id=edeka.id, sort_order=1),
        Department(name="Brot & Backwaren", store_id=edeka.id, sort_order=2),
        Department(name="Fleisch & Geflügel", store_id=edeka.id, sort_order=3),
        Department(name="Käse & Molkerei", store_id=edeka.id, sort_order=4),
        Department(name="Tiefkühlkost", store_id=edeka.id, sort_order=5),
        Department(name="Getränke", store_id=edeka.id, sort_order=6),
        Department(name="Grundnahrungsmittel", store_id=edeka.id, sort_order=7),
        Department(name="Süßwaren", store_id=edeka.id, sort_order=8),
        Department(name="Haushalt & Pflege", store_id=edeka.id, sort_order=9),
    ]
    for dept in edeka_departments:
        session.add(dept)
    session.commit()
    for dept in edeka_departments:
        session.refresh(dept)

    stores_data["Edeka"] = {
        "store": edeka,
        "departments": {dept.name: dept for dept in edeka_departments},
    }

    # Create kaufland
    kaufland_departments = Store(name="Kaufland", location="")
    session.add(kaufland_departments)
    session.commit()
    session.refresh(kaufland_departments)

    kaufland_departments_departments = [
        Department(
            name="Obst & Gemüse", store_id=kaufland_departments.id, sort_order=1
        ),
        Department(
            name="Brot & Backwaren", store_id=kaufland_departments.id, sort_order=2
        ),
        Department(
            name="Fleisch & Wurst", store_id=kaufland_departments.id, sort_order=3
        ),
        Department(name="Milch & Käse", store_id=kaufland_departments.id, sort_order=4),
        Department(name="Tiefkühl", store_id=kaufland_departments.id, sort_order=5),
        Department(name="Getränke", store_id=kaufland_departments.id, sort_order=6),
        Department(name="Vorräte", store_id=kaufland_departments.id, sort_order=7),
        Department(
            name="Süßwaren & Snacks", store_id=kaufland_departments.id, sort_order=8
        ),
        Department(name="Non-Food", store_id=kaufland_departments.id, sort_order=9),
    ]
    for dept in kaufland_departments_departments:
        session.add(dept)
    session.commit()
    for dept in kaufland_departments_departments:
        session.refresh(dept)

    stores_data["kaufland_departments"] = {
        "store": kaufland_departments,
        "departments": {dept.name: dept for dept in kaufland_departments_departments},
    }

    return stores_data


def seed_common_products(session: Session, stores_data: dict[str, dict]):
    """Create common products for each store.

    Args:
        session: Database session
        stores_data: Store and department data from seed_stores_and_departments
    """
    # Common products for Rewe
    rewe = stores_data["Rewe"]["store"]
    rewe_depts = stores_data["Rewe"]["departments"]

    rewe_products = [
        # Obst & Gemüse (fresh)
        Product(
            name="Äpfel",
            store_id=rewe.id,
            department_id=rewe_depts["Obst & Gemüse"].id,
            fresh=True,
        ),
        Product(
            name="Bananen",
            store_id=rewe.id,
            department_id=rewe_depts["Obst & Gemüse"].id,
            fresh=True,
        ),
        Product(
            name="Tomaten",
            store_id=rewe.id,
            department_id=rewe_depts["Obst & Gemüse"].id,
            fresh=True,
        ),
        Product(
            name="Möhren",
            store_id=rewe.id,
            department_id=rewe_depts["Obst & Gemüse"].id,
            fresh=True,
        ),
        Product(
            name="Kartoffeln",
            store_id=rewe.id,
            department_id=rewe_depts["Obst & Gemüse"].id,
            fresh=True,
        ),
        # Backwaren (fresh)
        Product(
            name="Brot",
            store_id=rewe.id,
            department_id=rewe_depts["Backwaren"].id,
            fresh=True,
        ),
        Product(
            name="Brötchen",
            store_id=rewe.id,
            department_id=rewe_depts["Backwaren"].id,
            fresh=True,
        ),
        # Milchprodukte (fresh)
        Product(
            name="Milch",
            store_id=rewe.id,
            department_id=rewe_depts["Milchprodukte"].id,
            fresh=True,
        ),
        Product(
            name="Butter",
            store_id=rewe.id,
            department_id=rewe_depts["Milchprodukte"].id,
            fresh=True,
        ),
        Product(
            name="Joghurt",
            store_id=rewe.id,
            department_id=rewe_depts["Milchprodukte"].id,
            fresh=True,
        ),
        Product(
            name="Käse",
            store_id=rewe.id,
            department_id=rewe_depts["Milchprodukte"].id,
            fresh=True,
        ),
        # Getränke (not fresh)
        Product(
            name="Wasser",
            store_id=rewe.id,
            department_id=rewe_depts["Getränke"].id,
            fresh=False,
        ),
        Product(
            name="Saft",
            store_id=rewe.id,
            department_id=rewe_depts["Getränke"].id,
            fresh=False,
        ),
        # Konserven & Haltbares (not fresh)
        Product(
            name="Mehl",
            store_id=rewe.id,
            department_id=rewe_depts["Konserven & Haltbares"].id,
            fresh=False,
        ),
        Product(
            name="Zucker",
            store_id=rewe.id,
            department_id=rewe_depts["Konserven & Haltbares"].id,
            fresh=False,
        ),
        Product(
            name="Nudeln",
            store_id=rewe.id,
            department_id=rewe_depts["Konserven & Haltbares"].id,
            fresh=False,
        ),
        Product(
            name="Reis",
            store_id=rewe.id,
            department_id=rewe_depts["Konserven & Haltbares"].id,
            fresh=False,
        ),
    ]

    for product in rewe_products:
        session.add(product)

    session.commit()


def seed_units(session: Session):
    """Create measurement units for ingredient parsing.

    Args:
        session: Database session
    """
    # Units list in the exact order from _get_known_units()
    units = [
        "g",
        "kg",
        "ml",
        "l",
        "L",
        "EL",
        "El",
        "TL",
        "Tl",
        "Prise",
        "Prisen",
        "Stück",
        "Stk",
        "Stk.",
        "Bund",
        "Becher",
        "Dose",
        "Dosen",
        "Pck",
        "Päckchen",
        "Tasse",
        "Tassen",
        "Stiel",
        "Stiele",
        "Zweig",
        "Zweige",
        "rote",
        "grüne",
        "gelbe",
    ]

    for idx, unit_name in enumerate(units):
        unit = Unit(name=unit_name, sort_order=idx)
        session.add(unit)

    session.commit()


def seed_database(engine=None):
    """Seed the database with initial stores, departments, and products.

    Args:
        engine: Optional database engine (uses default if not provided)
    """
    if engine is None:
        engine = get_engine()

    with get_session(engine) as session:
        # Check if data already exists
        existing_stores = session.exec(select(Store)).all()
        if existing_stores:
            print("Database already seeded. Skipping.")
            return

        print("Seeding database with stores, departments, products, and units...")

        # Create measurement units
        seed_units(session)

        # Create stores and departments
        stores_data = seed_stores_and_departments(session)

        # Create common products
        seed_common_products(session, stores_data)

        print("Database seeding completed successfully!")


if __name__ == "__main__":
    from .db import create_db_and_tables

    # Ensure tables exist
    create_db_and_tables()

    # Seed the database
    seed_database()
