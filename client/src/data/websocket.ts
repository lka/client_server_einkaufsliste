/**
 * WebSocket connection management for real-time updates
 *
 * Features:
 * - Auto-reconnection with exponential backoff
 * - Event subscription system
 * - Message queue during offline
 * - JWT authentication
 */

import { getToken } from './auth.js';
import type { Item, Store, User } from './api.js';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp?: string;
  userId?: number;
}

// WebSocket connection state
let ws: WebSocket | null = null;
let connectionState: ConnectionState = 'disconnected';
let reconnectAttempts = 0;
let reconnectTimeout: number | null = null;
let heartbeatInterval: number | null = null;
let messageQueue: WebSocketMessage[] = [];

// Event listeners
const eventListeners: Map<string, Set<Function>> = new Map();

// Configuration
const RECONNECT_DELAY_BASE = 1000; // 1 second
const RECONNECT_DELAY_MAX = 30000; // 30 seconds
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const MAX_QUEUE_SIZE = 100;

/**
 * Get WebSocket URL with authentication token
 */
function getWebSocketUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  const token = getToken();

  if (!token) {
    throw new Error('No authentication token available');
  }

  return `${protocol}//${host}/ws/${token}`;
}

/**
 * Calculate reconnect delay with exponential backoff
 */
function getReconnectDelay(): number {
  const delay = Math.min(
    RECONNECT_DELAY_BASE * Math.pow(2, reconnectAttempts),
    RECONNECT_DELAY_MAX
  );
  return delay + Math.random() * 1000; // Add jitter
}

/**
 * Start heartbeat ping/pong
 */
function startHeartbeat(): void {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }

  heartbeatInterval = window.setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      send({ type: 'ping', data: {} });
    }
  }, HEARTBEAT_INTERVAL);
}

/**
 * Stop heartbeat
 */
function stopHeartbeat(): void {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

/**
 * Send message to server
 */
function send(message: WebSocketMessage): void {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  } else {
    // Queue message for later
    if (messageQueue.length < MAX_QUEUE_SIZE) {
      messageQueue.push(message);
    } else {
      console.error('WebSocket message queue full, dropping message:', message.type);
    }
  }
}

/**
 * Process queued messages
 */
function processQueue(): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    return;
  }

  while (messageQueue.length > 0) {
    const message = messageQueue.shift();
    if (message) {
      ws.send(JSON.stringify(message));
    }
  }
}

/**
 * Notify event listeners
 */
function notifyListeners(eventType: string, data: any): void {
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

/**
 * Handle incoming WebSocket message
 */
function handleMessage(event: MessageEvent): void {
  try {
    const message: WebSocketMessage = JSON.parse(event.data);

    // Handle pong response
    if (message.type === 'pong') {
      return;
    }

    // Notify listeners for this event type
    notifyListeners(message.type, message.data);
  } catch (error) {
    console.error('Error parsing WebSocket message:', error);
  }
}

/**
 * Handle WebSocket connection open
 */
function handleOpen(): void {
  console.log('WebSocket connected');
  connectionState = 'connected';
  reconnectAttempts = 0;

  // Start heartbeat
  startHeartbeat();

  // Process queued messages
  processQueue();

  // Notify connection listeners
  notifyListeners('connection:open', null);
}

/**
 * Handle WebSocket connection close
 */
function handleClose(event: CloseEvent): void {
  console.log('WebSocket disconnected:', event.code, event.reason);
  connectionState = 'disconnected';

  // Stop heartbeat
  stopHeartbeat();

  // Notify close listeners
  notifyListeners('connection:close', { code: event.code, reason: event.reason });

  // Attempt reconnection if not intentional close
  if (event.code !== 1000) {
    scheduleReconnect();
  }
}

/**
 * Handle WebSocket error
 */
function handleError(event: Event): void {
  console.error('WebSocket error:', event);
  notifyListeners('connection:error', event);
}

/**
 * Schedule reconnection attempt
 */
function scheduleReconnect(): void {
  if (reconnectTimeout) {
    return; // Already scheduled
  }

  connectionState = 'reconnecting';
  reconnectAttempts++;

  const delay = getReconnectDelay();
  console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts})...`);

  reconnectTimeout = window.setTimeout(() => {
    reconnectTimeout = null;
    connect();
  }, delay);
}

/**
 * Connect to WebSocket server
 */
export function connect(): void {
  if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) {
    console.log('WebSocket already connected or connecting');
    return;
  }

  try {
    connectionState = 'connecting';
    const url = getWebSocketUrl();
    ws = new WebSocket(url);

    ws.onopen = handleOpen;
    ws.onclose = handleClose;
    ws.onerror = handleError;
    ws.onmessage = handleMessage;
  } catch (error) {
    console.error('Error creating WebSocket connection:', error);
    connectionState = 'disconnected';
    scheduleReconnect();
  }
}

/**
 * Disconnect from WebSocket server
 */
export function disconnect(): void {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  stopHeartbeat();

  if (ws) {
    // Close with code 1000 (normal closure) to prevent auto-reconnect
    ws.close(1000, 'Client disconnect');
    ws = null;
  }

  connectionState = 'disconnected';
  reconnectAttempts = 0;
  messageQueue = [];
}

/**
 * Check if WebSocket is connected
 */
export function isConnected(): boolean {
  return ws !== null && ws.readyState === WebSocket.OPEN;
}

/**
 * Get current connection state
 */
export function getConnectionState(): ConnectionState {
  return connectionState;
}

/**
 * Subscribe to WebSocket events
 */
function subscribe(eventType: string, callback: Function): () => void {
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

// Event subscription helpers
export function onItemAdded(callback: (item: Item) => void): () => void {
  return subscribe('item:added', callback);
}

export function onItemDeleted(callback: (itemId: string) => void): () => void {
  return subscribe('item:deleted', callback);
}

export function onItemUpdated(callback: (item: Item) => void): () => void {
  return subscribe('item:updated', callback);
}

export function onStoreChanged(callback: (store: Store) => void): () => void {
  return subscribe('store:changed', callback);
}

export function onUserJoined(callback: (user: User) => void): () => void {
  return subscribe('user:joined', callback);
}

export function onUserLeft(callback: (userId: number) => void): () => void {
  return subscribe('user:left', callback);
}

export function onDepartmentUpdated(callback: (department: any) => void): () => void {
  return subscribe('department:updated', callback);
}

export function onConnectionOpen(callback: () => void): () => void {
  return subscribe('connection:open', callback);
}

export function onConnectionClose(callback: (event: { code: number; reason: string }) => void): () => void {
  return subscribe('connection:close', callback);
}

export function onConnectionError(callback: (error: Event) => void): () => void {
  return subscribe('connection:error', callback);
}

// Broadcast events to server
export function broadcastItemAdd(item: Item): void {
  send({
    type: 'item:add',
    data: item
  });
}

export function broadcastItemDelete(itemId: string): void {
  send({
    type: 'item:delete',
    data: { id: itemId }
  });
}

export function broadcastItemUpdate(item: Item): void {
  send({
    type: 'item:update',
    data: item
  });
}

/**
 * Check if WebSocket is supported by browser
 */
export function isWebSocketSupported(): boolean {
  return 'WebSocket' in window;
}