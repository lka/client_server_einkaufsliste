/**
 * WebSocket event subscription helpers.
 */

import type { Item, Store, User } from '../api.js';
import { subscribe } from './event-system.js';

// Item event subscriptions
export function onItemAdded(callback: (item: Item) => void): () => void {
  return subscribe('item:added', callback);
}

export function onItemDeleted(callback: (itemId: string) => void): () => void {
  return subscribe('item:deleted', callback);
}

export function onItemUpdated(callback: (item: Item) => void): () => void {
  return subscribe('item:updated', callback);
}

// Store event subscriptions
export function onStoreChanged(callback: (store: Store) => void): () => void {
  return subscribe('store:changed', callback);
}

// User event subscriptions
export function onUserJoined(callback: (user: User) => void): () => void {
  return subscribe('user:joined', callback);
}

export function onUserLeft(callback: (userId: number) => void): () => void {
  return subscribe('user:left', callback);
}

export function onActiveUserCount(callback: (data: { count: number }) => void): () => void {
  return subscribe('users:active_count', callback);
}

// Department event subscriptions
export function onDepartmentUpdated(callback: (department: any) => void): () => void {
  return subscribe('department:updated', callback);
}

// Connection event subscriptions
export function onConnectionOpen(callback: () => void): () => void {
  return subscribe('connection:open', callback);
}

export function onConnectionClose(callback: (event: { code: number; reason: string }) => void): () => void {
  return subscribe('connection:close', callback);
}

export function onConnectionError(callback: (error: Event) => void): () => void {
  return subscribe('connection:error', callback);
}

// Weekplan event subscriptions
export function onWeekplanAdded(callback: (data: any) => void): () => void {
  return subscribe('weekplan:added', callback);
}

export function onWeekplanDeleted(callback: (data: { id: number }) => void): () => void {
  return subscribe('weekplan:deleted', callback);
}
