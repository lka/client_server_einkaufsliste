/**
 * WebSocket heartbeat (ping/pong) management.
 */

import { state } from './state.js';
import { send } from './message-handler.js';
import { HEARTBEAT_INTERVAL } from './config.js';

/**
 * Start heartbeat ping/pong.
 */
export function startHeartbeat(): void {
  if (state.heartbeatInterval) {
    clearInterval(state.heartbeatInterval);
  }

  state.heartbeatInterval = window.setInterval(() => {
    if (state.ws && state.ws.readyState === WebSocket.OPEN) {
      send({ type: 'ping', data: {} });
    }
  }, HEARTBEAT_INTERVAL);
}

/**
 * Stop heartbeat.
 */
export function stopHeartbeat(): void {
  if (state.heartbeatInterval) {
    clearInterval(state.heartbeatInterval);
    state.heartbeatInterval = null;
  }
}
