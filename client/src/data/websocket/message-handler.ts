/**
 * WebSocket message handling.
 */

import type { WebSocketMessage } from './types.js';
import { getWebSocket, isConnected, queueMessage, shiftMessageFromQueue } from './state.js';
import { notifyListeners } from './event-system.js';
import { MAX_QUEUE_SIZE } from './config.js';

/**
 * Send message to server.
 */
export function send(message: WebSocketMessage): void {
  const ws = getWebSocket();

  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  } else {
    // Queue message for later
    const queue = [];
    let current = shiftMessageFromQueue();
    while (current) {
      queue.push(current);
      current = shiftMessageFromQueue();
    }

    if (queue.length < MAX_QUEUE_SIZE) {
      queueMessage(message);
    } else {
      console.error('WebSocket message queue full, dropping message:', message.type);
    }
  }
}

/**
 * Process queued messages.
 */
export function processQueue(): void {
  if (!isConnected()) {
    return;
  }

  const ws = getWebSocket();
  if (!ws) return;

  let message = shiftMessageFromQueue();
  while (message) {
    ws.send(JSON.stringify(message));
    message = shiftMessageFromQueue();
  }
}

/**
 * Handle incoming WebSocket message.
 */
export function handleMessage(event: MessageEvent): void {
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
