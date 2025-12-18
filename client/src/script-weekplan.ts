import { loadAppTemplate } from './data/dom.js';
import { isAuthenticated, getTokenExpiresIn } from './data/auth.js';
import { initWeekplan } from './ui/weekplan.js';
import { initUserMenu, updateUserDisplay } from './ui/user-menu.js';
import { initializeComponents } from './ui/components/index.js';
import { initializeKnownUnits } from './data/api.js';
import * as websocket from './data/websocket.js';
import { ConnectionStatus } from './ui/components/connection-status.js';
import { setConnectionStatusInstance } from './ui/user-menu/websocket-handlers.js';
import { initInactivityTracker } from './data/inactivity-tracker.js';

window.addEventListener('DOMContentLoaded', async () => {
  // Check authentication
  if (!isAuthenticated()) {
    window.location.href = '/';
    return;
  }

  // Initialize UI components
  initializeComponents();

  // Load the weekplan template
  const templateLoaded = await loadAppTemplate('weekplan.html');
  if (!templateLoaded) {
    console.error('Failed to initialize weekplan page');
    return;
  }

  // Update user display
  await updateUserDisplay();

  // Initialize known units cache from server
  await initializeKnownUnits();

  // Initialize weekplan functionality
  initWeekplan();

  // Initialize user menu
  initUserMenu();

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
    // Delay connection slightly to ensure token is loaded on slower devices
    websocket.connect();

    // Add connection status indicator to header-actions (before user menu)
    const headerActions = document.querySelector('.header-actions') as HTMLElement;
    if (headerActions) {
      const connectionStatus = new ConnectionStatus({
        container: headerActions,
        showUserCount: false
      });
      // Store the instance for proper cleanup when toggling WebSocket
      setConnectionStatusInstance(connectionStatus);
    } else {
      console.warn('Header actions element not found for ConnectionStatus');
    }
  }
});
