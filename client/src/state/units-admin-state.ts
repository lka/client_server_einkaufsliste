/**
 * Units Admin state management.
 * Manages units state with WebSocket integration.
 */

import type { Unit } from '../ui/units-admin/types.js';
import { fetchUnits } from '../data/api.js';
import * as websocket from '../data/websocket.js';

type StateChangeListener = (state: UnitsAdminStateData) => void;

export interface UnitsAdminStateData {
  units: Unit[];
}

/**
 * Units Admin state manager.
 * Provides centralized state management with WebSocket integration.
 */
class UnitsAdminState {
  private state: UnitsAdminStateData = {
    units: [],
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
      console.log('UnitsAdminState: WebSocket already initialized');
      return;
    }

    // Only initialize if WebSocket is supported
    if (!websocket.isWebSocketSupported()) {
      console.log('UnitsAdminState: WebSocket not supported');
      return;
    }

    this.wsInitialized = true;

    // Subscribe to unit events
    this.wsUnsubscribers.push(
      websocket.subscribe('unit:created', () => {
        this.loadUnits();
      })
    );

    this.wsUnsubscribers.push(
      websocket.subscribe('unit:updated', () => {
        this.loadUnits();
      })
    );

    this.wsUnsubscribers.push(
      websocket.subscribe('unit:deleted', () => {
        this.loadUnits();
      })
    );

    console.log('UnitsAdminState: WebSocket initialized');
  }

  /**
   * Get current state (read-only copy)
   */
  getState(): UnitsAdminStateData {
    return {
      units: [...this.state.units],
    };
  }

  /**
   * Get units (read-only copy)
   */
  getUnits(): Unit[] {
    return [...this.state.units];
  }

  /**
   * Load units from API
   */
  async loadUnits(): Promise<void> {
    try {
      const units = await fetchUnits();
      this.state.units = units;
      this.notifyListeners();
    } catch (error) {
      console.error('UnitsAdminState: Failed to load units:', error);
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
export const unitsAdminState = new UnitsAdminState();
