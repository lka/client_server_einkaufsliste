"""Analyze the date logic for the weekplan entry."""
from datetime import datetime, timedelta

# Given information:
# - Today: Friday 2025-11-28
# - Weekplan entry: Saturday 2025-11-29 with "Beilage Kartoffeln"
# - Template item: Kartoffeln 500g
# - Product: Kartoffeln is marked as fresh=True
# - Expected: Items should be added to NEXT Friday (2025-12-05), not today

today = datetime(2025, 11, 28).replace(hour=0, minute=0, second=0, microsecond=0)
weekplan_date = datetime(2025, 11, 29)
main_shopping_day = 2  # Wednesday
fresh_products_day = 4  # Friday

def _get_next_weekday(from_date: datetime, target_weekday: int) -> datetime:
    days_ahead = target_weekday - from_date.weekday()
    if days_ahead < 0:
        days_ahead += 7
    return from_date + timedelta(days=days_ahead)

next_main_shopping = _get_next_weekday(today, main_shopping_day)
next_fresh_products = _get_next_weekday(today, fresh_products_day)

# NEW LOGIC: If shopping day is today, move to next week
if next_main_shopping.date() == today.date():
    next_main_shopping = next_main_shopping + timedelta(days=7)
if next_fresh_products.date() == today.date():
    next_fresh_products = next_fresh_products + timedelta(days=7)

print(f"Today: {today.strftime('%Y-%m-%d %A')} (weekday={today.weekday()})")
print(f"Weekplan date: {weekplan_date.strftime('%Y-%m-%d %A')} (weekday={weekplan_date.weekday()})")
print(f"\nNext main shopping (Wednesday): {next_main_shopping.date().isoformat()}")
print(f"Next fresh products (Friday): {next_fresh_products.date().isoformat()}")

# Logic from weekplan.py lines 108-111:
# if weekplan_datetime.date() > next_fresh_products.date() and is_fresh:
#     shopping_date = next_fresh_products.date().isoformat()

is_fresh = True
shopping_date = next_main_shopping.date().isoformat()

print(f"\nCondition check:")
print(f"  weekplan_date > next_fresh_products? {weekplan_date.date()} > {next_fresh_products.date()} = {weekplan_date.date() > next_fresh_products.date()}")
print(f"  is_fresh? {is_fresh}")

if weekplan_date.date() > next_fresh_products.date() and is_fresh:
    shopping_date = next_fresh_products.date().isoformat()
    print(f"\n  → Using fresh products day: {shopping_date}")
else:
    print(f"\n  → Using main shopping day: {shopping_date}")

print(f"\nExpected shopping date: {shopping_date}")
print("OLD behavior: Items were added to 2025-11-28 (today)")
print(f"NEW behavior: Items should be added to {shopping_date}")
print(f"\nExpected result: {shopping_date} (next Friday, not today)")
