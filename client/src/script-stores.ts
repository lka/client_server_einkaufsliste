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

  console.log('WebSocket status (store-admin):', { supported: wsSupported });

  if (wsSupported) {
    console.log('Store-Admin is connecting to WebSocket...');

    // Initialize WebSocket event listeners in state BEFORE connecting
    storeAdminState.initializeWebSocket();

    // Now connect to WebSocket server
    websocket.connect();
  }
});
