/**
 * Units administration UI component.
 *
 * Provides UI for managing measurement units (create, delete, reorder).
 */

import {
  setupWebSocketHandlers,
  _cleanupUnitsAdmin,
  loadUnits,
  initializeUnitsAdminUI } from './units-admin/index.js';
import { unitsAdminState } from '../state/units-admin-state.js';

/**
 * Initialize the units admin UI.
 */
export function initUnitsAdmin(): void {
  // Initialize UI with state subscription
  initializeUnitsAdminUI();

  // Initialize WebSocket in state
  unitsAdminState.initializeWebSocket();

  // Load initial data
  loadUnits();

  // Setup legacy WebSocket handlers (if any)
  setupWebSocketHandlers();
}

/**
 * Cleanup WebSocket handlers when leaving the page.
 */
export function cleanupUnitsAdmin(): void {
  _cleanupUnitsAdmin();
  unitsAdminState.destroy();
}
