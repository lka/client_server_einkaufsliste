/**
 * Shopping list client application entry point.
 * Orchestrates the initialization of all application modules.
 */

import { loadAppTemplate } from './data/dom.js';
import { isAuthenticated } from './data/auth.js';
import { initShoppingListUI } from './ui/shopping-list-ui.js';
import { initUserMenu, updateUserDisplay } from './ui/user-menu.js';
import { initializeComponents } from './ui/components/index.js';

/**
 * Initialize the application when DOM is ready.
 */
window.addEventListener('DOMContentLoaded', async () => {
  // Check authentication first
  if (!isAuthenticated()) {
    window.location.href = '/';
    return;
  }

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
});
