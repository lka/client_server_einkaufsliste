/**
 * WebSocket connection management for real-time updates
 *
 * Features:
 * - Auto-reconnection with exponential backoff
 * - Event subscription system
 * - Message queue during offline
 * - JWT authentication
 */

// Re-export types
export type { ConnectionState, WebSocketMessage } from './websocket/types.js';

// Re-export connection management
export { connect, disconnect, isWebSocketSupported } from './websocket/connection.js';
export { isConnected, getConnectionState } from './websocket/state.js';

// Re-export event system
export { subscribe } from './websocket/event-system.js';

// Re-export event subscriptions
export {
  onItemAdded,
  onItemDeleted,
  onItemUpdated,
  onStoreChanged,
  onUserJoined,
  onUserLeft,
  onActiveUserCount,
  onDepartmentUpdated,
  onConnectionOpen,
  onConnectionClose,
  onConnectionError,
  onWeekplanAdded,
  onWeekplanDeleted,
  onProductAdded,
  onProductUpdated,
  onProductDeleted,
  onStoreAdded,
  onStoreUpdated,
  onStoreDeleted,
  onDepartmentAdded,
  onDepartmentDeleted,
  onTemplateAdded,
  onTemplateUpdated,
  onTemplateDeleted
} from './websocket/subscriptions.js';

// Re-export broadcast functions
export {
  broadcastItemAdd,
  broadcastItemDelete,
  broadcastItemUpdate,
  broadcastWeekplanAdd,
  broadcastWeekplanDelete
} from './websocket/broadcasts.js';
