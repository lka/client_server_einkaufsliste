/**
 * Connection Status Component
 *
 * Visual indicator for WebSocket connection status with real-time updates.
 * Shows connection state (connected, reconnecting, disconnected) and provides
 * notifications for connection events.
 */

import * as websocket from '../../data/websocket.js';
import { showSuccess, showWarning, showError } from './toast.js';

export interface ConnectionStatusOptions {
  container: HTMLElement;
  onReconnect?: () => void;
  showUserCount?: boolean;
}

/**
 * Connection Status Component
 *
 * Features:
 * - Visual dot indicator (green/yellow/red)
 * - Connection state label
 * - Toast notifications on state changes
 * - Optional user count display
 */
export class ConnectionStatus {
  private container: HTMLElement;
  private statusIndicator: HTMLElement;
  private statusLabel: HTMLElement;
  private userCountEl: HTMLElement | null = null;
  private unsubscribers: Array<() => void> = [];
  private onReconnect?: () => void;

  constructor(options: ConnectionStatusOptions) {
    this.container = options.container;
    this.onReconnect = options.onReconnect;

    this.statusIndicator = document.createElement('span');
    this.statusLabel = document.createElement('span');

    this.render();
    this.subscribeToEvents();
    this.updateStatus();

    if (options.showUserCount) {
      this.createUserCountDisplay();
    }
  }

  /**
   * Render the connection status UI
   */
  private render(): void {
    const wrapper = document.createElement('div');
    wrapper.className = 'connection-status';
    wrapper.setAttribute('aria-live', 'polite');

    this.statusIndicator.className = 'connection-status-dot';
    this.statusIndicator.setAttribute('aria-hidden', 'true');

    this.statusLabel.className = 'connection-status-label';
    this.statusLabel.textContent = 'Verbindung wird hergestellt...';

    wrapper.appendChild(this.statusIndicator);
    wrapper.appendChild(this.statusLabel);

    this.container.appendChild(wrapper);
  }

  /**
   * Create user count display element
   */
  private createUserCountDisplay(): void {
    this.userCountEl = document.createElement('span');
    this.userCountEl.className = 'connection-status-users';
    this.userCountEl.textContent = '';
    this.container.appendChild(this.userCountEl);
  }

  /**
   * Subscribe to WebSocket connection events
   */
  private subscribeToEvents(): void {
    this.unsubscribers.push(
      websocket.onConnectionOpen(() => {
        this.updateStatus();
        showSuccess('WebSocket verbunden - Live-Updates aktiv');
        if (this.onReconnect) {
          this.onReconnect();
        }
      })
    );

    this.unsubscribers.push(
      websocket.onConnectionClose((event) => {
        this.updateStatus();
        if (event.code !== 1000) {
          showWarning('WebSocket getrennt - Neuverbindung...');
        }
      })
    );

    this.unsubscribers.push(
      websocket.onConnectionError(() => {
        this.updateStatus();
        showError('WebSocket-Verbindungsfehler');
      })
    );

    this.unsubscribers.push(
      websocket.onUserJoined((user) => {
        showInfo(`${user.username || 'Benutzer'} ist jetzt online`);
        this.updateUserCount();
      })
    );

    this.unsubscribers.push(
      websocket.onUserLeft(() => {
        this.updateUserCount();
      })
    );
  }

  /**
   * Update visual status based on connection state
   */
  private updateStatus(): void {
    const state = websocket.getConnectionState();

    // Remove all state classes
    this.statusIndicator.classList.remove('connected', 'reconnecting', 'disconnected', 'connecting');

    // Add current state class
    this.statusIndicator.classList.add(state);

    // Update label text
    switch (state) {
      case 'connected':
        this.statusLabel.textContent = 'Online';
        this.statusIndicator.title = 'WebSocket verbunden';
        break;
      case 'connecting':
        this.statusLabel.textContent = 'Verbinde...';
        this.statusIndicator.title = 'WebSocket verbindet';
        break;
      case 'reconnecting':
        this.statusLabel.textContent = 'Neuverbindung...';
        this.statusIndicator.title = 'WebSocket Neuverbindung';
        break;
      case 'disconnected':
        this.statusLabel.textContent = 'Offline';
        this.statusIndicator.title = 'WebSocket getrennt';
        break;
    }
  }

  /**
   * Update user count display (if enabled)
   */
  private updateUserCount(): void {
    if (!this.userCountEl) {
      return;
    }

    // Note: This would require server to send user count
    // For now, just show indicator that users are connected
    if (websocket.isConnected()) {
      this.userCountEl.textContent = '👥';
      this.userCountEl.title = 'Mehrere Benutzer online';
    } else {
      this.userCountEl.textContent = '';
    }
  }

  /**
   * Destroy component and cleanup
   */
  destroy(): void {
    // Unsubscribe from all events
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];

    // Remove DOM elements
    this.container.innerHTML = '';
  }
}

/**
 * Helper function for info toasts (using existing toast component)
 */
function showInfo(message: string): void {
  // Reuse existing toast if available, otherwise use console
  if (typeof (window as any).showInfo === 'function') {
    (window as any).showInfo(message);
  } else {
    console.info(message);
  }
}

/**
 * Inject connection status styles
 */
export function injectConnectionStatusStyles(): void {
  const styleId = 'connection-status-styles';

  if (document.getElementById(styleId)) {
    return; // Already injected
  }

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .connection-status {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 0.75rem;
      font-size: 0.875rem;
      color: var(--text-muted, #666);
    }

    .connection-status-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      transition: background-color 0.3s ease;
    }

    .connection-status-dot.connected {
      background-color: #22c55e;
      box-shadow: 0 0 6px rgba(34, 197, 94, 0.5);
    }

    .connection-status-dot.connecting {
      background-color: #3b82f6;
      animation: pulse 1.5s ease-in-out infinite;
    }

    .connection-status-dot.reconnecting {
      background-color: #f59e0b;
      animation: pulse 1.5s ease-in-out infinite;
    }

    .connection-status-dot.disconnected {
      background-color: #ef4444;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }

    .connection-status-label {
      font-weight: 500;
      user-select: none;
    }

    .connection-status-users {
      margin-left: 0.5rem;
      font-size: 1rem;
    }

    /* Mobile responsive */
    @media (max-width: 640px) {
      .connection-status-label {
        display: none;
      }

      .connection-status {
        padding: 0.25rem;
      }
    }
  `;

  document.head.appendChild(style);
}