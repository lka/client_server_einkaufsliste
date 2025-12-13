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
  console.log('WebSocket URL:', wsUrl.replace(token, 'TOKEN_HIDDEN'));
  console.log('Browser Info:', {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    location: {
      protocol: window.location.protocol,
      host: window.location.host,
      hostname: window.location.hostname,
      port: window.location.port
    }
  });

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

  console.log('connect() called', { ws, readyState: ws?.readyState });

  if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) {
    console.log('WebSocket already connected or connecting');
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

    console.log('Creating WebSocket connection...');
    const newWs = new WebSocket(url);

    newWs.onopen = () => {
      // Clear connection timeout on successful connection
      if (state.connectionTimeout) {
        clearTimeout(state.connectionTimeout);
        state.connectionTimeout = null;
      }
      handleOpen();
    };

    newWs.onclose = handleClose;
    newWs.onerror = handleError;
    newWs.onmessage = handleMessage;

    setWebSocket(newWs);
    console.log('WebSocket instance created, waiting for connection...');

    // Safari workaround: Force close connection if stuck in CONNECTING state
    // Safari's "Advanced Tracking and Fingerprinting Protection" blocks WebSocket to local IPs
    state.connectionTimeout = window.setTimeout(() => {
      if (newWs.readyState === WebSocket.CONNECTING) {
        console.warn('WebSocket connection timeout - stuck in CONNECTING state');
        console.warn('Safari Advanced Protection may be blocking WebSocket to local IPs');
        console.warn('App will continue using HTTP polling');

        // Force close the stuck connection
        newWs.close();
        setConnectionState('disconnected');

        // Don't retry - Safari will keep blocking
      }
    }, 5000); // 5 second timeout
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
 * Returns false for Safari due to Advanced Tracking Protection blocking local IPs.
 */
export function isWebSocketSupported(): boolean {
  if (!('WebSocket' in window)) {
    return false;
  }

  // Detect Safari browser
  // Safari's Advanced Tracking and Fingerprinting Protection blocks WebSocket to local IPs
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  if (isSafari) {
    console.log('Safari detected - WebSocket disabled due to Advanced Protection blocking local IPs');
    return false;
  }

  return true;
}
