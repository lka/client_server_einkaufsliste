/**
 * Store administration page entry point.
 * Orchestrates the initialization of the store admin module.
 */

import { loadAppTemplate } from './data/dom.js';
import { isAuthenticated } from './data/auth.js';
import { initStoreAdmin } from './ui/store-admin.js';
import { initUserMenu, updateUserDisplay } from './ui/user-menu.js';
import { initializeComponents } from './ui/components/index.js';
import * as websocket from './data/websocket.js';
import { storeAdminState } from './state/store-admin-state.js';
import { ConnectionStatus } from './ui/components/connection-status.js';
import { setConnectionStatusInstance } from './ui/user-menu/websocket-handlers.js';

/**
 * Initialize the store admin page when DOM is ready.
 */
window.addEventListener('DOMContentLoaded', async () => {
  // Check authentication first
  if (!isAuthenticated()) {
    window.location.href = '/';
    return;
  }

  // Initialize component library styles
  initializeComponents();

  // Load the stores template
  const templateLoaded = await loadAppTemplate('stores.html');
  if (!templateLoaded) {
    console.error('Failed to initialize store admin page');
    return;
  }

  // Update user display
  await updateUserDisplay();

  // Initialize store admin module
  initStoreAdmin();
  initUserMenu();

  // Initialize WebSocket connection if enabled
  const wsSupported = websocket.isWebSocketSupported();

  if (wsSupported) {
    // Initialize WebSocket event listeners in state BEFORE connecting
    storeAdminState.initializeWebSocket();

    // Now connect to WebSocket server
    websocket.connect();

    // Add connection status indicator to header-actions (before user menu)
    const headerActions = document.querySelector('.header-actions') as HTMLElement;
    if (headerActions) {
      const connectionStatus = new ConnectionStatus({
        container: headerActions,
        onReconnect: () => {
          // Reload stores when reconnected to sync state
          storeAdminState.loadStores();
        },
        showUserCount: false
      });
      // Store the instance for proper cleanup when toggling WebSocket
      setConnectionStatusInstance(connectionStatus);
    } else {
      console.warn('Header actions element not found for ConnectionStatus');
    }
  }
});
