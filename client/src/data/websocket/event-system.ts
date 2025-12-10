/**
 * WebSocket event subscription system.
 */

// Event listeners
const eventListeners: Map<string, Set<Function>> = new Map();

/**
 * Subscribe to WebSocket events.
 */
export function subscribe(eventType: string, callback: Function): () => void {
  if (!eventListeners.has(eventType)) {
    eventListeners.set(eventType, new Set());
  }

  eventListeners.get(eventType)!.add(callback);

  // Return unsubscribe function
  return () => {
    const listeners = eventListeners.get(eventType);
    if (listeners) {
      listeners.delete(callback);
    }
  };
}

/**
 * Notify event listeners.
 */
export function notifyListeners(eventType: string, data: any): void {
  const listeners = eventListeners.get(eventType);
  if (listeners) {
    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in WebSocket event listener for ${eventType}:`, error);
      }
    });
  }
}
