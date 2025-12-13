/**
 * WebSocket connection state management.
 */

import type { ConnectionState, ConnectionStateManager, WebSocketMessage } from './types.js';

// WebSocket connection state
export const state: ConnectionStateManager = {
  ws: null,
  connectionState: 'disconnected' as ConnectionState,
  reconnectAttempts: 0,
  reconnectTimeout: null,
  heartbeatInterval: null,
  messageQueue: [],
  connectionTimeout: null
};

/**
 * Get current WebSocket instance.
 */
export function getWebSocket(): WebSocket | null {
  return state.ws;
}

/**
 * Set WebSocket instance.
 */
export function setWebSocket(ws: WebSocket | null): void {
  state.ws = ws;
}

/**
 * Get current connection state.
 */
export function getConnectionState(): ConnectionState {
  return state.connectionState;
}

/**
 * Set connection state.
 */
export function setConnectionState(connectionState: ConnectionState): void {
  state.connectionState = connectionState;
}

/**
 * Check if WebSocket is connected.
 */
export function isConnected(): boolean {
  return state.ws !== null && state.ws.readyState === WebSocket.OPEN;
}

/**
 * Get reconnect attempts count.
 */
export function getReconnectAttempts(): number {
  return state.reconnectAttempts;
}

/**
 * Increment reconnect attempts.
 */
export function incrementReconnectAttempts(): void {
  state.reconnectAttempts++;
}

/**
 * Reset reconnect attempts.
 */
export function resetReconnectAttempts(): void {
  state.reconnectAttempts = 0;
}

/**
 * Get message queue.
 */
export function getMessageQueue(): WebSocketMessage[] {
  return state.messageQueue;
}

/**
 * Clear message queue.
 */
export function clearMessageQueue(): void {
  state.messageQueue = [];
}

/**
 * Add message to queue.
 */
export function queueMessage(message: WebSocketMessage): void {
  state.messageQueue.push(message);
}

/**
 * Shift message from queue.
 */
export function shiftMessageFromQueue(): WebSocketMessage | undefined {
  return state.messageQueue.shift();
}
