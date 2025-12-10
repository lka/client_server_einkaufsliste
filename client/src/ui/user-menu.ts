/**
 * User menu module.
 * Handles user menu interactions (logout, account deletion).
 */

import { loadMenuTemplate, loadVersionInfo } from './user-menu/utils.js';
import { attachMenuToggleHandlers } from './user-menu/menu-toggle-handlers.js';
import { attachNavigationHandlers } from './user-menu/navigation-handlers.js';
import { attachWebSocketHandlers, getConnectionStatusInstance as getWSConnectionStatus, setConnectionStatusInstance as setWSConnectionStatus } from './user-menu/websocket-handlers.js';
import { attachLogoutHandler, updateUserDisplay as updateUserDisplayImpl } from './user-menu/auth-handlers.js';

/**
 * Update user display in header with current username.
 * Re-exported for backward compatibility.
 */
export async function updateUserDisplay(): Promise<void> {
  await updateUserDisplayImpl();
}

/**
 * Get the current ConnectionStatus instance.
 * Re-exported for backward compatibility.
 */
export function getConnectionStatusInstance() {
  return getWSConnectionStatus();
}

/**
 * Set the ConnectionStatus instance (for external initialization).
 * Re-exported for backward compatibility.
 */
export function setConnectionStatusInstance(instance: any) {
  setWSConnectionStatus(instance);
}

/**
 * Initialize user menu event handlers.
 */
export async function initUserMenu(): Promise<void> {
  const menuBtn = document.getElementById('menuBtn');
  const menuDropdown = document.getElementById('menuDropdown');

  if (!menuBtn || !menuDropdown) {
    console.error('User menu elements not found');
    return;
  }

  // Load menu template
  await loadMenuTemplate(menuDropdown);

  // Attach all handlers
  attachMenuToggleHandlers(menuBtn, menuDropdown);
  attachNavigationHandlers();
  attachWebSocketHandlers();
  attachLogoutHandler();

  // Load and display version information
  loadVersionInfo();
}
