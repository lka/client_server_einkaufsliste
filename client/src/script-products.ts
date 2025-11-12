/**
 * Products page entry point
 */

import { loadAppTemplate } from './data/dom.js';
import { isAuthenticated } from './data/auth.js';
import { initProductAdmin } from './ui/product-admin.js';
import { initUserMenu, updateUserDisplay } from './ui/user-menu.js';
import { initializeComponents } from './ui/components/index.js';

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
});
