/**
 * Template administration page entry point.
 * Orchestrates the initialization of the template admin module.
 */

import { loadAppTemplate } from './data/dom.js';
import { isAuthenticated } from './data/auth.js';
import { initTemplateAdmin } from './ui/template-admin.js';
import { initUserMenu, updateUserDisplay } from './ui/user-menu.js';
import { initializeComponents } from './ui/components/index.js';
import * as websocket from './data/websocket.js';
import { templateAdminState } from './state/template-admin-state.js';

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

  // Initialize WebSocket connection if supported
  const wsSupported = websocket.isWebSocketSupported();

  console.log('WebSocket status (template-admin):', { supported: wsSupported });

  if (wsSupported) {
    console.log('Connecting to WebSocket for template-admin...');

    // Initialize WebSocket event listeners in state BEFORE connecting
    templateAdminState.initializeWebSocket();

    // Now connect to WebSocket server
    websocket.connect();
  }
});
