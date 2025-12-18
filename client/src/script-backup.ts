/**
 * Entry point for the backup management page.
 */

import { loadAppTemplate } from './data/dom.js';
import { isAuthenticated, getTokenExpiresIn } from './data/auth.js';
import { updateUserDisplay, initUserMenu } from './ui/user-menu.js';
import { initBackupAdmin } from './ui/backup-admin.js';
import { initializeComponents } from './ui/components/index.js';
import { initInactivityTracker } from './data/inactivity-tracker.js';

/**
 * Initialize the backup admin page when DOM is ready.
 */
window.addEventListener('DOMContentLoaded', async () => {
  // Check authentication first
  if (!isAuthenticated()) {
    window.location.href = '/';
    return;
  }

  // Initialize component library styles
  initializeComponents();

  // Load the backup page template
  const templateLoaded = await loadAppTemplate('backup.html');
  if (!templateLoaded) {
    console.error('Failed to initialize backup admin page');
    return;
  }

  // Update user display in header
  await updateUserDisplay();

  // Initialize backup admin UI
  initBackupAdmin();

  // Initialize user menu
  initUserMenu();

  // Initialize inactivity tracker
  const expiresIn = getTokenExpiresIn();
  if (expiresIn) {
    initInactivityTracker(expiresIn);
  } else {
    console.warn('Token expiration time not found - inactivity tracker not initialized');
  }
});
