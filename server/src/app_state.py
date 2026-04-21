"""Shared application state for the server.

Module-level variables that need to be accessible across routers
without circular imports. Use direct attribute access to mutate:
    import app_state; app_state.single_shopping_day_enabled = True
"""

# Synced from clients via WebSocket; applied when calculating shopping dates
single_shopping_day_enabled: bool = False
