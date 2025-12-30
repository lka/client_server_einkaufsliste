/**
 * WebSocket handlers for units admin interface.
 *
 * @deprecated WebSocket integration has been moved to the State Layer.
 * See src/state/units-admin-state.ts for WebSocket event handling.
 * These functions are kept for backward compatibility but are now no-ops.
 */

/**
 * Setup WebSocket event handlers for real-time unit updates.
 * @deprecated WebSocket is now initialized via unitsAdminState.initializeWebSocket()
 */
export function setupWebSocketHandlers(): void {
  // WebSocket integration moved to State Layer (units-admin-state.ts)
  // This function is kept for backward compatibility but does nothing
}

/**
 * Cleanup WebSocket handlers when leaving the page.
 * @deprecated Cleanup is now handled via unitsAdminState.destroy()
 */
export function _cleanupUnitsAdmin(): void {
  // WebSocket cleanup moved to State Layer (units-admin-state.ts)
  // This function is kept for backward compatibility but does nothing
}
