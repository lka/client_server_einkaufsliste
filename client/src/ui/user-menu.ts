/**
 * User menu module.
 * Handles user menu interactions (logout, account deletion).
 */

import { logout } from '../data/auth.js';
import { userState } from '../state/user-state.js';
import { shoppingListState } from '../state/shopping-list-state.js';
import { getVersion } from '../data/api.js';
import * as websocket from '../data/websocket.js';
import { ConnectionStatus, showToast } from './components/index.js';
import { stopInactivityTracker } from '../data/inactivity-tracker.js';
import { getSelectedStoreId, showDeleteByDateDialog } from './shopping-list-ui.js';

// Store ConnectionStatus instance for proper cleanup
let connectionStatusInstance: ConnectionStatus | null = null;

// Cache for menu template to avoid redundant fetches
let menuTemplateCache: string | null = null;

/**
 * Load the menu dropdown template from HTML file.
 */
async function loadMenuTemplate(menuDropdown: HTMLElement): Promise<void> {
  try {
    // Return cached template if available
    if (menuTemplateCache) {
      menuDropdown.innerHTML = menuTemplateCache;
      return;
    }

    // Fetch template
    const response = await fetch('src/ui/components/menu-dropdown.html');
    if (!response.ok) {
      console.error('Failed to load menu template:', response.statusText);
      return;
    }

    const html = await response.text();
    menuTemplateCache = html;
    menuDropdown.innerHTML = html;
  } catch (error) {
    console.error('Error loading menu template:', error);
  }
}

/**
 * Get the current ConnectionStatus instance
 */
export function getConnectionStatusInstance(): ConnectionStatus | null {
  return connectionStatusInstance;
}

/**
 * Set the ConnectionStatus instance (for external initialization)
 */
export function setConnectionStatusInstance(instance: ConnectionStatus | null): void {
  connectionStatusInstance = instance;
}

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
export async function initUserMenu(): Promise<void> {
  const menuBtn = document.getElementById('menuBtn');
  const menuDropdown = document.getElementById('menuDropdown');

  if (!menuBtn || !menuDropdown) {
    console.error('User menu elements not found');
    return;
  }

  // Load menu template
  await loadMenuTemplate(menuDropdown);

  // Get menu buttons after template is loaded
  const backToAppBtn = document.getElementById('backToAppBtn');
  const weekplanBtn = document.getElementById('weekplanBtn');
  const settingsMenuBtn = document.getElementById('settingsMenuBtn');
  const settingsSubmenu = document.getElementById('settingsSubmenu');
  const websocketMenuBtn = document.getElementById('websocketMenuBtn');
  const websocketSubmenu = document.getElementById('websocketSubmenu');
  const manageStoresBtn = document.getElementById('manageStoresBtn');
  const manageProductsBtn = document.getElementById('manageProductsBtn');
  const manageTemplatesBtn = document.getElementById('manageTemplatesBtn');
  const manageUsersBtn = document.getElementById('manageUsersBtn');
  const manageBackupBtn = document.getElementById('manageBackupBtn');
  const manageWebDAVBtn = document.getElementById('manageWebDAVBtn');
  const toggleWebSocketBtn = document.getElementById('toggleWebSocketBtn');
  const copyWebSocketLinkBtn = document.getElementById('copyWebSocketLinkBtn');
  const clearByDateBtn = document.getElementById('clearByDateBtn');
  const documentationBtn = document.getElementById('documentationBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  // Menu toggle handler
  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    menuDropdown.classList.toggle('show');
  });

  // Close menu when clicking outside
  document.addEventListener('click', () => {
    menuDropdown.classList.remove('show');
    // Also close submenus
    if (settingsSubmenu) {
      settingsSubmenu.classList.remove('show');
    }
    if (settingsMenuBtn) {
      settingsMenuBtn.classList.remove('expanded');
    }
    if (websocketSubmenu) {
      websocketSubmenu.classList.remove('show');
    }
    if (websocketMenuBtn) {
      websocketMenuBtn.classList.remove('expanded');
    }
  });

  // Prevent menu from closing when clicking inside dropdown
  menuDropdown.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Settings submenu toggle handler
  if (settingsMenuBtn && settingsSubmenu) {
    settingsMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      settingsSubmenu.classList.toggle('show');
      settingsMenuBtn.classList.toggle('expanded');
    });
  }

  // WebSocket submenu toggle handler
  if (websocketMenuBtn && websocketSubmenu) {
    websocketMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      websocketSubmenu.classList.toggle('show');
      websocketMenuBtn.classList.toggle('expanded');
    });
  }

  // Back to app button handler
  if (backToAppBtn) {
    backToAppBtn.addEventListener('click', () => {
      window.location.href = '/app';
    });
  }

  // Weekplan button handler
  if (weekplanBtn) {
    weekplanBtn.addEventListener('click', () => {
      window.location.href = '/weekplan';
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
      // Try to get the currently selected store from shopping list
      const selectedStoreId = getSelectedStoreId();
      if (selectedStoreId) {
        window.location.href = `/products?store=${selectedStoreId}`;
      } else {
        window.location.href = '/products';
      }
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

  // Manage WebDAV button handler
  if (manageWebDAVBtn) {
    manageWebDAVBtn.addEventListener('click', () => {
      window.location.href = '/webdav';
    });
  }

  // Clear by date button handler
  if (clearByDateBtn) {
    clearByDateBtn.addEventListener('click', async () => {
      await showDeleteByDateDialog();
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

        // Properly destroy the ConnectionStatus instance (removes DOM and unsubscribes)
        if (connectionStatusInstance) {
          connectionStatusInstance.destroy();
          connectionStatusInstance = null;
        }
      } else {
        // Enable and connect
        localStorage.setItem('enable_ws', 'true');

        if (websocket.isWebSocketSupported()) {
          // Add connection status indicator to header-actions if not present (BEFORE connecting)
          const headerActions = document.querySelector('.header-actions') as HTMLElement;
          const existingStatus = headerActions?.querySelector('.connection-status');

          if (headerActions && !existingStatus && !connectionStatusInstance) {
            connectionStatusInstance = new ConnectionStatus({
              container: headerActions,
              onReconnect: () => {
                // Reload items when reconnected to sync state
                shoppingListState.loadItems();
              },
              showUserCount: true
            });
          }

          // Connect after status indicator is created to ensure events are properly subscribed
          websocket.connect();
        } else {
          alert('WebSocket wird von Ihrem Browser nicht unterstützt.');
        }
      }

      // Update button text
      updateWebSocketButtonState();
    });
  }

  // Copy WebSocket Link button handler
  if (copyWebSocketLinkBtn) {
    copyWebSocketLinkBtn.addEventListener('click', async () => {
      // Generate URL with WebSocket parameter
      const url = new URL(window.location.href);
      url.searchParams.set('ws', '1');
      const wsLink = url.toString();

      try {
        // Try to use native share API if available (mobile devices)
        if (navigator.share) {
          await navigator.share({
            title: 'Einkaufsliste mit WebSocket',
            text: 'Öffne die Einkaufsliste mit aktiviertem WebSocket',
            url: wsLink
          });
          showToast({
            message: 'Link erfolgreich geteilt!',
            type: 'success',
            duration: 2000
          });
          console.log('Link erfolgreich geteilt');
        } else {
          // Fallback: Copy to clipboard
          await navigator.clipboard.writeText(wsLink);

          // Show success toast
          showToast({
            message: '✓ WebSocket-Link in Zwischenablage kopiert!',
            type: 'success',
            duration: 2000
          });
        }
      } catch (error) {
        console.error('Fehler beim Kopieren/Teilen des Links:', error);

        showToast({
          message: 'Fehler beim Kopieren des Links',
          type: 'error',
          duration: 3000
        });

        // Ultimate fallback: Show the link in an alert
        alert(`WebSocket-Link:\n\n${wsLink}\n\nBitte manuell kopieren.`);
      }
    });
  }

  // Documentation button handler
  if (documentationBtn) {
    documentationBtn.addEventListener('click', () => {
      window.open('https://github.com/lka/client_server_einkaufsliste/blob/master/README.md', '_blank');
    });
  }

  // Logout button handler
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      stopInactivityTracker();
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
