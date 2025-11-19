/**
 * User menu module.
 * Handles user menu interactions (logout, account deletion).
 */

import { logout } from '../data/auth.js';
import { userState } from '../state/user-state.js';
import { shoppingListState } from '../state/shopping-list-state.js';
import { getVersion } from '../data/api.js';
import * as websocket from '../data/websocket.js';
import { ConnectionStatus } from './components/index.js';

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
  const toggleWebSocketBtn = document.getElementById('toggleWebSocketBtn');
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

  // Toggle WebSocket button handler
  if (toggleWebSocketBtn) {
    // Update button text based on current state
    const updateWebSocketButtonState = () => {
      const isConnected = websocket.isConnected();
      const isEnabled = localStorage.getItem('enable_ws') === 'true';

      if (isConnected) {
        toggleWebSocketBtn.textContent = '🔌 WebSocket deaktivieren';
      } else if (isEnabled) {
        toggleWebSocketBtn.textContent = '🔌 WebSocket verbinden...';
      } else {
        toggleWebSocketBtn.textContent = '🔌 WebSocket aktivieren';
      }
    };

    // Initialize button state
    updateWebSocketButtonState();

    // Update button state when connection changes
    websocket.onConnectionOpen(() => {
      updateWebSocketButtonState();
    });

    websocket.onConnectionClose(() => {
      updateWebSocketButtonState();
    });

    toggleWebSocketBtn.addEventListener('click', () => {
      const isConnected = websocket.isConnected();

      if (isConnected) {
        // Disconnect and disable
        websocket.disconnect();
        localStorage.removeItem('enable_ws');

        // Remove connection status indicator
        const statusElement = document.querySelector('.connection-status');
        if (statusElement) {
          statusElement.remove();
        }
      } else {
        // Enable and connect
        localStorage.setItem('enable_ws', 'true');

        if (websocket.isWebSocketSupported()) {
          websocket.connect();

          // Add connection status indicator to header-actions if not present
          const headerActions = document.querySelector('.header-actions') as HTMLElement;
          const existingStatus = headerActions?.querySelector('.connection-status');

          if (headerActions && !existingStatus) {
            new ConnectionStatus({
              container: headerActions,
              onReconnect: () => {
                // Reload items when reconnected to sync state
                shoppingListState.loadItems();
              },
              showUserCount: true
            });
          }
        } else {
          alert('WebSocket wird von Ihrem Browser nicht unterstützt.');
        }
      }

      // Update button text
      updateWebSocketButtonState();
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
