"""Check templates via API."""
import requests

# First, login to get a token
login_response = requests.post(
    "http://localhost:8000/api/auth/login",
    json={"username": "lischka", "password": ".Amdahl1320"}
)

if login_response.status_code == 200:
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Get all templates
    templates_response = requests.get(
        "http://localhost:8000/api/templates",
        headers=headers
    )

    print("Templates from API:")
    if templates_response.status_code == 200:
        templates = templates_response.json()
        for t in templates:
            print(f'  - "{t["name"]}"')

        # Check for 'Beilage Kartoffeln'
        matching = [t for t in templates if t["name"] == "Beilage Kartoffeln"]
        if matching:
            print(f'\nFound template "Beilage Kartoffeln":')
            template_id = matching[0]["id"]

            # Get template details
            detail_response = requests.get(
                f"http://localhost:8000/api/templates/{template_id}",
                headers=headers
            )
            if detail_response.status_code == 200:
                details = detail_response.json()
                print(f'  Full response: {details}')
                print(f'  Items:')
                items = details.get("template_items", details.get("items", []))
                if items:
                    for item in items:
                        print(f'    - {item.get("name", "??")}: {item.get("menge", "??")}')
                else:
                    print('    (no items found in response)')
            else:
                print(f'  Detail request failed: {detail_response.status_code}')
        else:
            print('\nTemplate "Beilage Kartoffeln" NOT FOUND')
    else:
        print(f"Error: {templates_response.status_code}")
else:
    print(f"Login failed: {login_response.status_code}")
