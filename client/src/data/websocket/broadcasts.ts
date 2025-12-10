/**
 * WebSocket broadcast functions.
 */

import type { Item } from '../api.js';
import { send } from './message-handler.js';

// Item broadcast events
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

// Weekplan broadcast events
export function broadcastWeekplanAdd(entry: any): void {
  send({
    type: 'weekplan:add',
    data: entry,
    timestamp: new Date().toISOString()
  });
}

export function broadcastWeekplanDelete(entryId: number): void {
  send({
    type: 'weekplan:delete',
    data: { id: entryId },
    timestamp: new Date().toISOString()
  });
}
