"""Check product fresh flag and shopping list items."""
import requests

# Login to get token
login_response = requests.post(
    "http://localhost:8000/api/auth/login",
    json={"username": "lischka", "password": ".Amdahl1320"}
)

if login_response.status_code == 200:
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Get all products from store 1 (first store)
    products_response = requests.get(
        "http://localhost:8000/api/stores/1/products",
        headers=headers
    )

    if products_response.status_code == 200:
        products = products_response.json()
        print(f"Total products: {len(products)}")

        kartoffeln_products = [p for p in products if "Kartoffeln" in p.get("name", "")]

        print("\nProducts containing 'Kartoffeln':")
        if kartoffeln_products:
            for p in kartoffeln_products:
                print(f'  - {p["name"]}: fresh={p.get("fresh", False)} (store_id={p.get("store_id")})')
        else:
            print("  No products found containing 'Kartoffeln'")
    else:
        print(f"Products request failed: {products_response.status_code}")

    # Get shopping list items
    items_response = requests.get(
        "http://localhost:8000/api/items",
        headers=headers
    )

    if items_response.status_code == 200:
        items = items_response.json()
        print(f"\nTotal items in shopping list: {len(items)}")

        kartoffeln_items = [i for i in items if "Kartoffeln" in i.get("name", "")]
        if kartoffeln_items:
            print("Items containing 'Kartoffeln':")
            for item in kartoffeln_items:
                print(f'  - {item["name"]}: {item.get("menge", "")} (date={item.get("shopping_date", "")}, store={item.get("store_id", "")})')
        else:
            print("No items containing 'Kartoffeln' found in shopping list")

    # Get stores to see sort order
    stores_response = requests.get(
        "http://localhost:8000/api/stores",
        headers=headers
    )

    if stores_response.status_code == 200:
        stores = stores_response.json()
        print("\nStores (sorted by sort_order):")
        stores_sorted = sorted(stores, key=lambda s: (s.get("sort_order", 999), s.get("id", 999)))
        for s in stores_sorted:
            print(f'  - ID {s["id"]}: {s["name"]} (sort_order={s.get("sort_order", "N/A")})')
else:
    print(f"Login failed: {login_response.status_code}")
