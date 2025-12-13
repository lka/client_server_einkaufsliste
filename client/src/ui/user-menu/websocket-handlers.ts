/**
 * WebSocket event handlers for user menu.
 */

import * as websocket from '../../data/websocket.js';
import { shoppingListState } from '../../state/shopping-list-state.js';
import { ConnectionStatus, showToast } from '../components/index.js';

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
  const isEnabled = true; // localStorage.getItem('enable_ws') === 'true';

  if (isConnected) {
    button.textContent = '🔌 WebSocket deaktivieren';
  } else if (isEnabled) {
    button.textContent = '🔌 WebSocket verbinden...';
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
    // Enable and connect
    localStorage.setItem('enable_ws', 'true');

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
 * Handle copy WebSocket link button click.
 */
async function handleCopyWebSocketLink(): Promise<void> {
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
}

/**
 * Attach WebSocket handlers to menu items.
 */
export function attachWebSocketHandlers(): void {
  const toggleWebSocketBtn = document.getElementById('toggleWebSocketBtn');
  const copyWebSocketLinkBtn = document.getElementById('copyWebSocketLinkBtn');

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

  // Copy WebSocket Link button
  if (copyWebSocketLinkBtn) {
    copyWebSocketLinkBtn.addEventListener('click', handleCopyWebSocketLink);
  }
}
