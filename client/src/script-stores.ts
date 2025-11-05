/**
 * Store administration page entry point.
 * Orchestrates the initialization of the store admin module.
 */

import { loadAppTemplate } from './data/dom.js';
import { isAuthenticated } from './data/auth.js';
import { initStoreAdmin } from './ui/store-admin.js';
import { initUserMenu, updateUserDisplay } from './ui/user-menu.js';

/**
 * Initialize the store admin page when DOM is ready.
 */
window.addEventListener('DOMContentLoaded', async () => {
  // Check authentication first
  if (!isAuthenticated()) {
    window.location.href = '/';
    return;
  }

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
});
