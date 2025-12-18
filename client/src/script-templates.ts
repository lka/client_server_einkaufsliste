/**
 * Template administration page entry point.
 * Orchestrates the initialization of the template admin module.
 */

import { loadAppTemplate } from './data/dom.js';
import { isAuthenticated, getTokenExpiresIn } from './data/auth.js';
import { initTemplateAdmin } from './ui/template-admin.js';
import { initUserMenu, updateUserDisplay } from './ui/user-menu.js';
import { initializeComponents } from './ui/components/index.js';
import * as websocket from './data/websocket.js';
import { templateAdminState } from './state/template-admin-state.js';
import { ConnectionStatus } from './ui/components/connection-status.js';
import { setConnectionStatusInstance } from './ui/user-menu/websocket-handlers.js';
import { initInactivityTracker } from './data/inactivity-tracker.js';

/**
 * Initialize the template admin page when DOM is ready.
 */
window.addEventListener('DOMContentLoaded', async () => {
  // Check authentication first
  if (!isAuthenticated()) {
    window.location.href = '/';
    return;
  }

  // Initialize component library styles
  initializeComponents();

  // Load the templates template
  const templateLoaded = await loadAppTemplate('templates.html');
  if (!templateLoaded) {
    console.error('Failed to initialize template admin page');
    return;
  }

  // Update user display
  await updateUserDisplay();

  // Initialize template admin module
  initTemplateAdmin();
  initUserMenu();

  // Initialize inactivity tracker
  const expiresIn = getTokenExpiresIn();
  if (expiresIn) {
    initInactivityTracker(expiresIn);
  } else {
    console.warn('Token expiration time not found - inactivity tracker not initialized');
  }

  // Initialize WebSocket connection if supported
  const wsSupported = websocket.isWebSocketSupported();

  if (wsSupported) {
    // Initialize WebSocket event listeners in state BEFORE connecting
    templateAdminState.initializeWebSocket();

    // Now connect to WebSocket server
    websocket.connect();

    // Add connection status indicator to header-actions (before user menu)
    const headerActions = document.querySelector('.header-actions') as HTMLElement;
    if (headerActions) {
      const connectionStatus = new ConnectionStatus({
        container: headerActions,
        onReconnect: () => {
          // Reload templates when reconnected to sync state
          templateAdminState.loadTemplates();
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
