/**
 * WebDAV Admin state management.
 * Manages WebDAV settings state with WebSocket integration.
 */

import type { WebDAVSettings } from '../data/api.js';
import { fetchWebDAVSettings } from '../data/api.js';
import * as websocket from '../data/websocket.js';

type StateChangeListener = (state: WebDAVAdminStateData) => void;

export interface WebDAVAdminStateData {
  settings: WebDAVSettings[];
}

/**
 * WebDAV Admin state manager.
 * Provides centralized state management with WebSocket integration.
 */
class WebDAVAdminState {
  private state: WebDAVAdminStateData = {
    settings: [],
  };

  private listeners: Set<StateChangeListener> = new Set();
  private wsUnsubscribers: Array<() => void> = [];
  private wsInitialized: boolean = false;

  constructor() {
    // Don't initialize WebSocket in constructor - wait for explicit call
    // This avoids race conditions with token availability on slower devices
  }

  /**
   * Initialize WebSocket event listeners for real-time updates.
   * This should be called explicitly after token is confirmed available.
   */
  initializeWebSocket(): void {
    // Prevent double initialization
    if (this.wsInitialized) {
      console.log('WebDAVAdminState: WebSocket already initialized');
      return;
    }

    // Only initialize if WebSocket is supported
    if (!websocket.isWebSocketSupported()) {
      console.log('WebDAVAdminState: WebSocket not supported');
      return;
    }

    this.wsInitialized = true;

    // Subscribe to WebDAV settings events (if/when implemented on server)
    // For now, just reload settings on any WebDAV-related event
    this.wsUnsubscribers.push(
      websocket.subscribe('webdav:created', () => {
        this.loadSettings();
      })
    );

    this.wsUnsubscribers.push(
      websocket.subscribe('webdav:updated', () => {
        this.loadSettings();
      })
    );

    this.wsUnsubscribers.push(
      websocket.subscribe('webdav:deleted', () => {
        this.loadSettings();
      })
    );

    console.log('WebDAVAdminState: WebSocket initialized');
  }

  /**
   * Get current state (read-only copy)
   */
  getState(): WebDAVAdminStateData {
    return {
      settings: [...this.state.settings],
    };
  }

  /**
   * Get settings (read-only copy)
   */
  getSettings(): WebDAVSettings[] {
    return [...this.state.settings];
  }

  /**
   * Load settings from API
   */
  async loadSettings(): Promise<void> {
    try {
      const settings = await fetchWebDAVSettings();
      this.state.settings = settings;
      this.notifyListeners();
    } catch (error) {
      console.error('WebDAVAdminState: Failed to load settings:', error);
      throw error;
    }
  }

  /**
   * Subscribe to state changes
   * @returns Unsubscribe function
   */
  subscribe(listener: StateChangeListener): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    const currentState = this.getState();
    this.listeners.forEach(listener => listener(currentState));
  }

  /**
   * Cleanup WebSocket subscriptions
   */
  destroy(): void {
    this.wsUnsubscribers.forEach(unsubscribe => unsubscribe());
    this.wsUnsubscribers = [];
    this.listeners.clear();
    this.wsInitialized = false;
  }
}

// Export singleton instance
export const webdavAdminState = new WebDAVAdminState();
