/**
 * WebSocket handlers for units admin interface.
 */

import { subscribe } from '../../data/websocket.js';
import { loadUnits } from './units-admin-actions.js';

// Store unsubscribe functions for cleanup
let unsubscribeCreated: (() => void) | null = null;
let unsubscribeUpdated: (() => void) | null = null;
let unsubscribeDeleted: (() => void) | null = null;


/**
 * Setup WebSocket event handlers for real-time unit updates.
 */
export function setupWebSocketHandlers(): void {
  // Handle unit created by other users
  unsubscribeCreated = subscribe('unit:created', () => {
    loadUnits();
  });

  // Handle unit updated by other users
  unsubscribeUpdated = subscribe('unit:updated', () => {
    loadUnits();
  });

  // Handle unit deleted by other users
  unsubscribeDeleted = subscribe('unit:deleted', () => {
    loadUnits();
  });
}

/**
 * Cleanup WebSocket handlers when leaving the page.
 */
export function _cleanupUnitsAdmin(): void {
  if (unsubscribeCreated) unsubscribeCreated();
  if (unsubscribeUpdated) unsubscribeUpdated();
  if (unsubscribeDeleted) unsubscribeDeleted();
}
