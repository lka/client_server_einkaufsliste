/**
 * WebSocket event handlers for user menu.
 */

import * as websocket from '../../data/websocket.js';
import { shoppingListState } from '../../state/shopping-list-state.js';
import { ConnectionStatus } from '../components/index.js';

// Store ConnectionStatus instance for proper cleanup
let connectionStatusInstance: ConnectionStatus | null = null;

/**
 * Get the current ConnectionStatus instance.
 */
export function getConnectionStatusInstance(): ConnectionStatus | null {
  return connectionStatusInstance;
}

/**
 * Set the ConnectionStatus instance (for external initialization).
 */
export function setConnectionStatusInstance(instance: ConnectionStatus | null): void {
  connectionStatusInstance = instance;
}

/**
 * Update WebSocket button text based on current connection state.
 */
function updateWebSocketButtonState(button: HTMLElement): void {
  const isConnected = websocket.isConnected();

  if (isConnected) {
    button.textContent = '🔌 WebSocket deaktivieren';
  } else {
    button.textContent = '🔌 WebSocket aktivieren';
  }
}

/**
 * Handle WebSocket toggle button click.
 */
function handleToggleWebSocket(button: HTMLElement): void {
  const isConnected = websocket.isConnected();

  if (isConnected) {
    // Disconnect and disable
    websocket.disconnect();
    // localStorage.removeItem('enable_ws');

    // Properly destroy the ConnectionStatus instance
    if (connectionStatusInstance) {
      connectionStatusInstance.destroy();
      connectionStatusInstance = null;
    }
  } else {

    if (websocket.isWebSocketSupported()) {
      // Add connection status indicator to header-actions if not present
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

      // Initialize state WebSocket listeners BEFORE connecting
      // This ensures event listeners are registered before any messages arrive
      shoppingListState.initializeWebSocket();

      // Connect after status indicator and state listeners are ready
      websocket.connect();
    } else {
      alert('WebSocket wird von Ihrem Browser nicht unterstützt.');
    }
  }

  // Update button text
  updateWebSocketButtonState(button);
}

/**
 * Attach WebSocket handlers to menu items.
 */
export function attachWebSocketHandlers(): void {
  const toggleWebSocketBtn = document.getElementById('toggleWebSocketBtn');

  // Toggle WebSocket button
  if (toggleWebSocketBtn) {
    // Initialize button state
    updateWebSocketButtonState(toggleWebSocketBtn);

    // Update button state when connection changes
    websocket.onConnectionOpen(() => {
      updateWebSocketButtonState(toggleWebSocketBtn);
    });

    websocket.onConnectionClose(() => {
      updateWebSocketButtonState(toggleWebSocketBtn);
    });

    toggleWebSocketBtn.addEventListener('click', () => {
      handleToggleWebSocket(toggleWebSocketBtn);
    });
  }
}
