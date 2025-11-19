/**
 * Shopping list client application entry point.
 * Orchestrates the initialization of all application modules.
 */

import { loadAppTemplate } from './data/dom.js';
import { isAuthenticated } from './data/auth.js';
import { initShoppingListUI } from './ui/shopping-list-ui.js';
import { initUserMenu, updateUserDisplay } from './ui/user-menu.js';
import { initializeComponents, ConnectionStatus } from './ui/components/index.js';
import * as websocket from './data/websocket.js';
import { shoppingListState } from './state/shopping-list-state.js';

/**
 * Check URL parameters for WebSocket activation.
 * Supports: ?enable_ws=true or ?ws=1
 */
function checkWebSocketURLParameter(): void {
  const params = new URLSearchParams(window.location.search);
  const enableWsParam = params.get('enable_ws') === 'true' || params.get('ws') === '1';

  if (enableWsParam) {
    localStorage.setItem('enable_ws', 'true');
    console.log('WebSocket enabled via URL parameter');

    // Remove the parameter from URL without reloading
    const url = new URL(window.location.href);
    url.searchParams.delete('enable_ws');
    url.searchParams.delete('ws');
    window.history.replaceState({}, '', url.toString());

    // Show confirmation (simple console message for now)
    console.log('✓ WebSocket wurde aktiviert!');
  }
}

/**
 * Initialize the application when DOM is ready.
 */
window.addEventListener('DOMContentLoaded', async () => {
  // Check authentication first
  if (!isAuthenticated()) {
    window.location.href = '/';
    return;
  }

  // Check for WebSocket activation via URL parameter
  checkWebSocketURLParameter();

  // Initialize component library styles
  initializeComponents();

  // Load the app template first
  const templateLoaded = await loadAppTemplate();
  if (!templateLoaded) {
    console.error('Failed to initialize application');
    return;
  }

  // Update user display
  await updateUserDisplay();

  // Initialize feature modules
  initShoppingListUI();
  initUserMenu();

  // Initialize WebSocket connection if enabled
  const wsEnabled = localStorage.getItem('enable_ws') === 'true';
  const wsSupported = websocket.isWebSocketSupported();

  console.log('WebSocket status:', { enabled: wsEnabled, supported: wsSupported });

  if (wsEnabled && wsSupported) {
    console.log('Connecting to WebSocket...');
    websocket.connect();

    // Add connection status indicator to header-actions (before user menu)
    const headerActions = document.querySelector('.header-actions') as HTMLElement;
    if (headerActions) {
      console.log('Creating ConnectionStatus component in header-actions');
      new ConnectionStatus({
        container: headerActions,
        onReconnect: () => {
          // Reload items when reconnected to sync state
          shoppingListState.loadItems();
        },
        showUserCount: true
      });
    } else {
      console.warn('Header actions element not found for ConnectionStatus');
    }
  } else {
    console.log('WebSocket not enabled. Run: localStorage.setItem("enable_ws", "true") and reload');
  }
});
