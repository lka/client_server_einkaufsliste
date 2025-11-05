/**
 * Shopping list client application entry point.
 * Orchestrates the initialization of all application modules.
 */

import { loadAppTemplate } from './data/dom.js';
import { isAuthenticated } from './data/auth.js';
import { initShoppingListUI } from './ui/shopping-list-ui.js';
import { initUserMenu, updateUserDisplay } from './ui/user-menu.js';
import { initStoreBrowser, toggleStoreBrowser } from './ui/store-browser.js';

/**
 * Initialize the application when DOM is ready.
 */
window.addEventListener('DOMContentLoaded', async () => {
  // Check authentication first
  if (!isAuthenticated()) {
    window.location.href = '/';
    return;
  }

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
  initStoreBrowser();

  // Add toggle button listener
  const toggleBtn = document.getElementById('toggleBrowserBtn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      toggleStoreBrowser();
    });
  }
});
