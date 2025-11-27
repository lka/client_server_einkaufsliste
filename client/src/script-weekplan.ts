import { loadAppTemplate } from './data/dom.js';
import { isAuthenticated } from './data/auth.js';
import { initWeekplan } from './ui/weekplan.js';
import { initUserMenu, updateUserDisplay } from './ui/user-menu.js';
import { initializeComponents } from './ui/components/index.js';
import * as websocket from './data/websocket.js';

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

  // Initialize weekplan functionality
  initWeekplan();

  // Initialize user menu
  initUserMenu();

  // Initialize WebSocket connection if enabled
  const wsEnabled = localStorage.getItem('enable_ws') === 'true';
  const wsSupported = websocket.isWebSocketSupported();

  if (wsEnabled && wsSupported) {
    console.log('Connecting to WebSocket...');
    websocket.connect();
  }
});
