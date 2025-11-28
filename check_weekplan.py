"""Check weekplan entries."""
import requests
from datetime import datetime, timedelta

# Login
login_response = requests.post(
    "http://localhost:8000/api/auth/login",
    json={"username": "lischka", "password": ".Amdahl1320"}
)

if login_response.status_code == 200:
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Get current week's Monday
    today = datetime.now()
    # Calculate this week's Monday
    days_since_monday = today.weekday()  # 0=Monday, 6=Sunday
    this_monday = (today - timedelta(days=days_since_monday)).date()

    print(f"Today: {today.strftime('%Y-%m-%d %A')}")
    print(f"This week's Monday: {this_monday.isoformat()}")

    # Get weekplan entries for this week
    weekplan_response = requests.get(
        f"http://localhost:8000/api/weekplan/entries?week_start={this_monday.isoformat()}",
        headers=headers
    )

    if weekplan_response.status_code == 200:
        entries = weekplan_response.json()
        print(f"\nWeekplan entries for week starting {this_monday.isoformat()}: {len(entries)} entries")

        beilage_entries = [e for e in entries if "Beilage" in e.get("text", "")]
        if beilage_entries:
            print("\nEntries containing 'Beilage':")
            for e in beilage_entries:
                date_obj = datetime.fromisoformat(e["date"])
                print(f'  - {e["date"]} ({date_obj.strftime("%A")}), {e["meal"]}: "{e["text"]}"')
        else:
            print("\nNo entries containing 'Beilage' found")

        kartoffeln_entries = [e for e in entries if "Kartoffeln" in e.get("text", "")]
        if kartoffeln_entries:
            print("\nEntries containing 'Kartoffeln':")
            for e in kartoffeln_entries:
                date_obj = datetime.fromisoformat(e["date"])
                print(f'  - {e["date"]} ({date_obj.strftime("%A")}), {e["meal"]}: "{e["text"]}"')
    else:
        print(f"Error getting weekplan: {weekplan_response.status_code}")
else:
    print(f"Login failed: {login_response.status_code}")
