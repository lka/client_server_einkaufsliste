/**
 * WebSocket connection management.
 */

import { getToken } from '../auth.js';
import {
  state,
  getWebSocket,
  setWebSocket,
  setConnectionState,
  resetReconnectAttempts,
  incrementReconnectAttempts,
  getReconnectAttempts,
  clearMessageQueue
} from './state.js';
import { RECONNECT_DELAY_BASE, RECONNECT_DELAY_MAX } from './config.js';
import { notifyListeners } from './event-system.js';
import { processQueue, handleMessage } from './message-handler.js';
import { startHeartbeat, stopHeartbeat } from './heartbeat.js';

/**
 * Get WebSocket URL with authentication token.
 */
function getWebSocketUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  const token = getToken();

  if (!token) {
    throw new Error('No authentication token available');
  }

  const wsUrl = `${protocol}//${host}/ws/${token}`;
  return wsUrl;
}

/**
 * Calculate reconnect delay with exponential backoff.
 */
function getReconnectDelay(): number {
  const attempts = getReconnectAttempts();
  const delay = Math.min(
    RECONNECT_DELAY_BASE * Math.pow(2, attempts),
    RECONNECT_DELAY_MAX
  );
  return delay + Math.random() * 1000; // Add jitter
}

/**
 * Handle WebSocket connection open.
 */
function handleOpen(): void {
  setConnectionState('connected');
  resetReconnectAttempts();

  // Start heartbeat
  startHeartbeat();

  // Process queued messages
  processQueue();

  // Notify connection listeners
  notifyListeners('connection:open', null);
}

/**
 * Handle WebSocket connection close.
 */
function handleClose(event: CloseEvent): void {
  setConnectionState('disconnected');

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
 * Handle WebSocket error.
 */
function handleError(event: Event): void {
  console.error('WebSocket error:', event);
  notifyListeners('connection:error', event);
}

/**
 * Schedule reconnection attempt.
 */
function scheduleReconnect(): void {
  if (state.reconnectTimeout) {
    return; // Already scheduled
  }

  setConnectionState('reconnecting');
  incrementReconnectAttempts();

  const delay = getReconnectDelay();

  state.reconnectTimeout = window.setTimeout(() => {
    state.reconnectTimeout = null;
    connect();
  }, delay);
}

/**
 * Connect to WebSocket server.
 */
export function connect(): void {
  const ws = getWebSocket();

  // Clean up any closed or closing connections
  if (ws && (ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING)) {
    setWebSocket(null);
  }

  // Don't create a new connection if one is already active
  const currentWs = getWebSocket();
  if (currentWs && (currentWs.readyState === WebSocket.CONNECTING || currentWs.readyState === WebSocket.OPEN)) {
    return;
  }

  // Clear any existing connection timeout
  if (state.connectionTimeout) {
    clearTimeout(state.connectionTimeout);
    state.connectionTimeout = null;
  }

  try {
    setConnectionState('connecting');
    const url = getWebSocketUrl();

    const ws = new WebSocket(url);

    ws.onopen = handleOpen;
    ws.onclose = handleClose;
    ws.onerror = handleError;
    ws.onmessage = handleMessage;

    setWebSocket(ws);

  } catch (error) {
    console.error('Error creating WebSocket connection:', error);

    // If no token is available, the error message will contain this
    if (error instanceof Error && error.message.includes('No authentication token')) {
      console.warn('WebSocket connection failed: Token not available yet');
    }

    setConnectionState('disconnected');
    scheduleReconnect();
  }
}

/**
 * Disconnect from WebSocket server.
 */
export function disconnect(): void {
  if (state.reconnectTimeout) {
    clearTimeout(state.reconnectTimeout);
    state.reconnectTimeout = null;
  }

  if (state.connectionTimeout) {
    clearTimeout(state.connectionTimeout);
    state.connectionTimeout = null;
  }

  stopHeartbeat();

  const ws = getWebSocket();
  if (ws) {
    // IMPORTANT: Set to null FIRST to prevent race conditions during page navigation
    // This ensures new pages don't try to reuse a closing connection
    setWebSocket(null);

    // Then close with code 1000 (normal closure) to prevent auto-reconnect
    ws.close(1000, 'Client disconnect');
  }

  setConnectionState('disconnected');
  resetReconnectAttempts();
  clearMessageQueue();
}

/**
 * Check if WebSocket is supported by browser.
 */
export function isWebSocketSupported(): boolean {
  if (!('WebSocket' in window)) {
    return false;
  }

  return true;
}
