/**
 * Units administration UI component.
 *
 * Provides UI for managing measurement units (create, delete, reorder).
 */

import { 
  setupWebSocketHandlers,
  _cleanupUnitsAdmin,
  loadUnits,
  attachUnitsAdminListeners } from './units-admin/index.js';

/**
 * Initialize the units admin UI.
 */
export function initUnitsAdmin(): void {
  loadUnits();
  attachUnitsAdminListeners();
  setupWebSocketHandlers();
}

/**
 * Cleanup WebSocket handlers when leaving the page.
 */
export function cleanupUnitsAdmin(): void {
  _cleanupUnitsAdmin();
}
