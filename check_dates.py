"""Check date logic for shopping list."""

from datetime import datetime, timedelta
import os

# Today's date
today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
print(
    f"Today: {today.strftime('%Y-%m-%d')} ({today.strftime('%A')}), weekday={today.weekday()}"
)

# Shopping day configuration
main_shopping_day = 2  # Wednesday (0=Monday)
fresh_products_day = 4  # Friday


def _get_next_weekday(from_date: datetime, target_weekday: int) -> datetime:
    """Calculate the next occurrence of a target weekday."""
    days_ahead = target_weekday - from_date.weekday()
    if days_ahead < 0:  # Target day already passed this week
        days_ahead += 7
    return from_date + timedelta(days=days_ahead)


next_main_shopping = _get_next_weekday(today, main_shopping_day)
next_fresh_products = _get_next_weekday(today, fresh_products_day)

print(f"MAIN_SHOPPING_DAY={main_shopping_day} (Wednesday)")
print(
    f"Next main shopping: {next_main_shopping.strftime('%Y-%m-%d')} ({next_main_shopping.strftime('%A')})"
)

print(f"\nFRESH_PRODUCTS_DAY={fresh_products_day} (Friday)")
print(
    f"Next fresh products: {next_fresh_products.strftime('%Y-%m-%d')} ({next_fresh_products.strftime('%A')})"
)

# User entered "Beilage Kartoffeln" on Saturday
# Let's calculate what date that was
weekplan_date_str = "Saturday"  # We need to know the actual date the user entered
print(f"\nUser entered 'Beilage Kartoffeln' on Saturday")
print(f"If weekplan date > next fresh products date and item is fresh,")
print(f"then shopping date should be: {next_fresh_products.date().isoformat()}")
print(f"Otherwise, shopping date should be: {next_main_shopping.date().isoformat()}")
