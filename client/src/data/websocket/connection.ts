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

  return `${protocol}//${host}/ws/${token}`;
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
  console.log('WebSocket connected');
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
  console.log('WebSocket disconnected:', event.code, event.reason);
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
  const attempts = getReconnectAttempts();
  console.log(`Reconnecting in ${delay}ms (attempt ${attempts})...`);

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

  if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) {
    console.log('WebSocket already connected or connecting');
    return;
  }

  try {
    setConnectionState('connecting');
    const url = getWebSocketUrl();
    const newWs = new WebSocket(url);

    newWs.onopen = handleOpen;
    newWs.onclose = handleClose;
    newWs.onerror = handleError;
    newWs.onmessage = handleMessage;

    setWebSocket(newWs);
  } catch (error) {
    console.error('Error creating WebSocket connection:', error);
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

  stopHeartbeat();

  const ws = getWebSocket();
  if (ws) {
    // Close with code 1000 (normal closure) to prevent auto-reconnect
    ws.close(1000, 'Client disconnect');
    setWebSocket(null);
  }

  setConnectionState('disconnected');
  resetReconnectAttempts();
  clearMessageQueue();
}

/**
 * Check if WebSocket is supported by browser.
 */
export function isWebSocketSupported(): boolean {
  return 'WebSocket' in window;
}
