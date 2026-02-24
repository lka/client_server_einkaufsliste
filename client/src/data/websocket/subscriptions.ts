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

// Product event subscriptions
export function onProductAdded(callback: (product: any) => void): () => void {
  return subscribe('product:added', callback);
}

export function onProductUpdated(callback: (product: any) => void): () => void {
  return subscribe('product:updated', callback);
}

export function onProductDeleted(callback: (data: { id: number }) => void): () => void {
  return subscribe('product:deleted', callback);
}

// Store management event subscriptions
export function onStoreAdded(callback: (store: Store) => void): () => void {
  return subscribe('store:added', callback);
}

export function onStoreUpdated(callback: (store: Store) => void): () => void {
  return subscribe('store:updated', callback);
}

export function onStoreDeleted(callback: (data: { id: number }) => void): () => void {
  return subscribe('store:deleted', callback);
}

export function onDepartmentAdded(callback: (department: any) => void): () => void {
  return subscribe('department:added', callback);
}

export function onDepartmentDeleted(callback: (data: { id: number }) => void): () => void {
  return subscribe('department:deleted', callback);
}

// Template event subscriptions
export function onTemplateAdded(callback: (template: any) => void): () => void {
  return subscribe('template:added', callback);
}

export function onTemplateUpdated(callback: (template: any) => void): () => void {
  return subscribe('template:updated', callback);
}

export function onTemplateDeleted(callback: (data: { id: number }) => void): () => void {
  return subscribe('template:deleted', callback);
}

// Weekplan settings event subscriptions
export function onSingleShoppingDayChanged(callback: (data: { enabled: boolean }) => void): () => void {
  return subscribe('weekplan:single_shopping_day', callback);
}
