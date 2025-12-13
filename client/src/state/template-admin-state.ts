/**
 * Template Admin state management.
 * Manages templates state with WebSocket integration.
 */

import type { Template } from '../data/api.js';
import { fetchTemplates } from '../data/api.js';
import * as websocket from '../data/websocket.js';

type StateChangeListener = (state: TemplateAdminStateData) => void;

export interface TemplateAdminStateData {
  templates: Template[];
  filteredTemplates: Template[];
  filterQuery: string;
}

/**
 * Template Admin state manager.
 * Provides centralized state management with WebSocket integration.
 */
class TemplateAdminState {
  private state: TemplateAdminStateData = {
    templates: [],
    filteredTemplates: [],
    filterQuery: '',
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
      console.log('TemplateAdminState: WebSocket already initialized');
      return;
    }

    // Only initialize if WebSocket is supported and feature flag is enabled
    if (!websocket.isWebSocketSupported()) {
      console.log('TemplateAdminState: WebSocket not supported');
      return;
    }

    const wsEnabled = localStorage.getItem('enable_ws') === 'true';
    if (!wsEnabled) {
      console.log('TemplateAdminState: WebSocket disabled by feature flag');
      return;
    }

    console.log('TemplateAdminState: Initializing WebSocket event listeners');
    this.wsInitialized = true;

    // Subscribe to template events
    this.wsUnsubscribers.push(
      websocket.onTemplateAdded((template: Template) => {
        const existingIndex = this.state.templates.findIndex(t => t.id === template.id);
        if (existingIndex === -1) {
          this.state.templates.push(template);
          this.applyFilter();
          this.notifyListeners();
        }
      })
    );

    this.wsUnsubscribers.push(
      websocket.onTemplateUpdated((template: Template) => {
        const existingIndex = this.state.templates.findIndex(t => t.id === template.id);
        if (existingIndex !== -1) {
          this.state.templates[existingIndex] = template;
          this.applyFilter();
          this.notifyListeners();
        }
      })
    );

    this.wsUnsubscribers.push(
      websocket.onTemplateDeleted((data: { id: number }) => {
        const initialLength = this.state.templates.length;
        this.state.templates = this.state.templates.filter(t => t.id !== data.id);
        if (this.state.templates.length !== initialLength) {
          this.applyFilter();
          this.notifyListeners();
        }
      })
    );
  }

  /**
   * Get current state (read-only copy).
   */
  getState(): TemplateAdminStateData {
    return {
      templates: [...this.state.templates],
      filteredTemplates: [...this.state.filteredTemplates],
      filterQuery: this.state.filterQuery,
    };
  }

  /**
   * Get templates array directly.
   */
  getTemplates(): Template[] {
    return [...this.state.templates];
  }

  /**
   * Get filtered templates array.
   */
  getFilteredTemplates(): Template[] {
    return [...this.state.filteredTemplates];
  }

  /**
   * Subscribe to state changes.
   * Returns an unsubscribe function.
   */
  subscribe(listener: StateChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of state change.
   */
  private notifyListeners(): void {
    const stateCopy = this.getState();
    this.listeners.forEach(listener => listener(stateCopy));
  }

  /**
   * Load templates from API.
   */
  async loadTemplates(): Promise<void> {
    this.state.templates = await fetchTemplates();
    this.applyFilter();
    this.notifyListeners();
  }

  /**
   * Set filter query and apply filter.
   */
  setFilterQuery(query: string): void {
    this.state.filterQuery = query;
    this.applyFilter();
    this.notifyListeners();
  }

  /**
   * Apply filter to templates list.
   */
  private applyFilter(): void {
    if (!this.state.filterQuery.trim()) {
      this.state.filteredTemplates = [...this.state.templates];
      return;
    }

    const query = this.state.filterQuery.toLowerCase();
    this.state.filteredTemplates = this.state.templates.filter(template =>
      template.name.toLowerCase().includes(query)
    );
  }

  /**
   * Get template by ID.
   */
  getTemplateById(templateId: number): Template | undefined {
    return this.state.templates.find(t => t.id === templateId);
  }

  /**
   * Cleanup WebSocket subscriptions.
   */
  cleanup(): void {
    this.wsUnsubscribers.forEach(unsub => unsub());
    this.wsUnsubscribers = [];
  }
}

// Export singleton instance
export const templateAdminState = new TemplateAdminState();
