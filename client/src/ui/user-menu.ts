/**
 * User menu module.
 * Handles user menu interactions (logout, account deletion).
 */

import { logout } from '../data/auth.js';
import { userState } from '../state/user-state.js';
import { shoppingListState } from '../state/shopping-list-state.js';
import { getVersion } from '../data/api.js';

/**
 * Update user display in header with current username.
 * Appends username to existing header text.
 */
export async function updateUserDisplay(): Promise<void> {
  const user = await userState.loadCurrentUser();
  if (user) {
    const header = document.querySelector('header h1');
    if (header) {
      // Get current text and check if username is already added
      const currentText = header.textContent || '';
      if (!currentText.includes(`(${user.username})`)) {
        // Append username to existing header text
        header.innerHTML = `${currentText} <small>(${user.username})</small>`;
      }
    }
  }
}

/**
 * Initialize user menu event handlers.
 */
export function initUserMenu(): void {
  const menuBtn = document.getElementById('menuBtn');
  const menuDropdown = document.getElementById('menuDropdown');
  const backToAppBtn = document.getElementById('backToAppBtn');
  const manageStoresBtn = document.getElementById('manageStoresBtn');
  const manageProductsBtn = document.getElementById('manageProductsBtn');
  const manageTemplatesBtn = document.getElementById('manageTemplatesBtn');
  const manageUsersBtn = document.getElementById('manageUsersBtn');
  const manageBackupBtn = document.getElementById('manageBackupBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  if (!menuBtn || !menuDropdown) {
    console.error('User menu elements not found');
    return;
  }

  // Menu toggle handler
  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    menuDropdown.classList.toggle('show');
  });

  // Close menu when clicking outside
  document.addEventListener('click', () => {
    menuDropdown.classList.remove('show');
  });

  // Prevent menu from closing when clicking inside dropdown
  menuDropdown.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Back to app button handler
  if (backToAppBtn) {
    backToAppBtn.addEventListener('click', () => {
      window.location.href = '/app';
    });
  }

  // Manage stores button handler
  if (manageStoresBtn) {
    manageStoresBtn.addEventListener('click', () => {
      window.location.href = '/stores';
    });
  }

  // Manage products button handler
  if (manageProductsBtn) {
    manageProductsBtn.addEventListener('click', () => {
      window.location.href = '/products';
    });
  }

  // Manage templates button handler
  if (manageTemplatesBtn) {
    manageTemplatesBtn.addEventListener('click', () => {
      window.location.href = '/templates';
    });
  }

  // Manage users button handler
  if (manageUsersBtn) {
    manageUsersBtn.addEventListener('click', () => {
      window.location.href = '/users';
    });
  }

  // Manage backup button handler
  if (manageBackupBtn) {
    manageBackupBtn.addEventListener('click', () => {
      window.location.href = '/backup';
    });
  }

  // Logout button handler
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      logout();
      userState.clearUser();
      shoppingListState.clear();
      window.location.href = '/';
    });
  }

  // Load and display version information
  loadVersionInfo();
}

/**
 * Load and display version information in the menu.
 */
async function loadVersionInfo(): Promise<void> {
  const versionInfo = await getVersion();

  // Find or create version display element
  let versionElement = document.getElementById('versionInfo');

  if (versionInfo && versionElement) {
    versionElement.textContent = `v${versionInfo.version}`;
    versionElement.title = `API: ${versionInfo.api}`;
  }
}
