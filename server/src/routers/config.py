"""Configuration API router.

Provides access to server configuration settings that are needed by the client.
"""

import os
from fastapi import APIRouter

router = APIRouter(prefix="/api/config", tags=["config"])


@router.get("")
def get_config():
    """Get server configuration settings.

    Returns:
        dict: Configuration settings including:
            - main_shopping_day: Integer 0-6 representing the main shopping day
              (0=Monday, 1=Tuesday, ..., 6=Sunday)
            - fresh_products_day: Integer 0-6 representing
              the fresh products shopping day
              (0=Monday, 1=Tuesday, ..., 6=Sunday)
    """
    # Get shopping day configuration from environment variables
    # Default to Wednesday (2) for main shopping day and Friday (4) for fresh products
    main_shopping_day = int(os.getenv("MAIN_SHOPPING_DAY", "2"))
    fresh_products_day = int(os.getenv("FRESH_PRODUCTS_DAY", "4"))

    # Validate the values are in range 0-6
    if not (0 <= main_shopping_day <= 6):
        main_shopping_day = 2  # Default to Wednesday
    if not (0 <= fresh_products_day <= 6):
        fresh_products_day = 4  # Default to Friday

    return {
        "main_shopping_day": main_shopping_day,
        "fresh_products_day": fresh_products_day,
    }
