/**
 * Products page entry point
 */

import { loadAppTemplate } from './data/dom.js';
import { isAuthenticated, getTokenExpiresIn } from './data/auth.js';
import { initProductAdmin } from './ui/product-admin.js';
import { initUserMenu, updateUserDisplay } from './ui/user-menu.js';
import { initializeComponents } from './ui/components/index.js';
import * as websocket from './data/websocket.js';
import { productAdminState } from './state/product-admin-state.js';
import { ConnectionStatus } from './ui/components/connection-status.js';
import { setConnectionStatusInstance } from './ui/user-menu/websocket-handlers.js';
import { initInactivityTracker } from './data/inactivity-tracker.js';

/**
 * Initialize the products admin page when DOM is ready.
 */
window.addEventListener('DOMContentLoaded', async () => {
  // Check authentication first
  if (!isAuthenticated()) {
    window.location.href = '/';
    return;
  }

  // Initialize component library styles
  initializeComponents();

  // Load the HTML template
  const loaded = await loadAppTemplate('products.html');
  if (!loaded) {
    console.error('Failed to load products template');
    return;
  }

  // Update user display
  await updateUserDisplay();

  // Initialize UI components
  initUserMenu();
  await initProductAdmin();

  // Initialize inactivity tracker
  const expiresIn = getTokenExpiresIn();
  if (expiresIn) {
    initInactivityTracker(expiresIn);
  } else {
    console.warn('Token expiration time not found - inactivity tracker not initialized');
  }

  // Initialize WebSocket connection if enabled
  const wsSupported = websocket.isWebSocketSupported();

  if (wsSupported) {
    // Initialize WebSocket event listeners in state BEFORE connecting
    productAdminState.initializeWebSocket();

    // Now connect to WebSocket server
    websocket.connect();

    // Add connection status indicator to header-actions (before user menu)
    const headerActions = document.querySelector('.header-actions') as HTMLElement;
    if (headerActions) {
      const connectionStatus = new ConnectionStatus({
        container: headerActions,
        onReconnect: () => {
          // Reload products when reconnected to sync state
          const state = productAdminState.getState();
          if (state.selectedStoreId) {
            productAdminState.loadProducts(state.selectedStoreId);
          }
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
