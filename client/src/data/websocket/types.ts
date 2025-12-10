/**
 * WebSocket type definitions.
 */

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp?: string;
  userId?: number;
}

export interface ConnectionStateManager {
  ws: WebSocket | null;
  connectionState: ConnectionState;
  reconnectAttempts: number;
  reconnectTimeout: number | null;
  heartbeatInterval: number | null;
  messageQueue: WebSocketMessage[];
}
