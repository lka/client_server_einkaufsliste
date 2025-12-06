/**
 * Weekplan state management.
 * Manages weekplan entries state and provides observers for UI updates.
 */

import type { WeekplanEntry } from './types.js';

type StateChangeListener = () => void;

/**
 * Weekplan state manager.
 * Provides centralized state management for weekplan entries.
 */
class WeekplanStateManager {
  // Store entries by date and meal: Map<dateISO, Map<meal, WeekplanEntry[]>>
  private entriesStore: Map<string, Map<string, WeekplanEntry[]>> = new Map();

  // Current week offset (0 = current week, -1 = previous, +1 = next)
  private weekOffset: number = 0;

  // Listeners for state changes
  private listeners: Set<StateChangeListener> = new Set();

  /**
   * Get all entries for a specific date and meal
   */
  getEntries(date: string, meal: string): WeekplanEntry[] {
    const dateMap = this.entriesStore.get(date);
    if (!dateMap) return [];

    const mealEntries = dateMap.get(meal);
    return mealEntries ? [...mealEntries] : [];
  }

  /**
   * Get all entries for a specific date
   */
  getDateEntries(date: string): Map<string, WeekplanEntry[]> {
    const dateMap = this.entriesStore.get(date);
    if (!dateMap) return new Map();

    // Return a copy
    return new Map(dateMap);
  }

  /**
   * Get the entire entries store (read-only copy)
   */
  getAllEntries(): Map<string, Map<string, WeekplanEntry[]>> {
    // Create a deep copy
    const copy = new Map<string, Map<string, WeekplanEntry[]>>();
    for (const [date, dateMap] of this.entriesStore.entries()) {
      const dateCopy = new Map<string, WeekplanEntry[]>();
      for (const [meal, entries] of dateMap.entries()) {
        dateCopy.set(meal, [...entries]);
      }
      copy.set(date, dateCopy);
    }
    return copy;
  }

  /**
   * Add an entry to the store
   */
  addEntry(entry: WeekplanEntry): void {
    if (!entry.date || !entry.meal) {
      console.error('Entry must have date and meal');
      return;
    }

    if (!this.entriesStore.has(entry.date)) {
      this.entriesStore.set(entry.date, new Map());
    }

    const dateMap = this.entriesStore.get(entry.date)!;
    if (!dateMap.has(entry.meal)) {
      dateMap.set(entry.meal, []);
    }

    dateMap.get(entry.meal)!.push(entry);
    this.notifyListeners();
  }

  /**
   * Remove an entry by ID
   */
  removeEntry(entryId: number): void {
    let found = false;

    for (const [, dateMap] of this.entriesStore.entries()) {
      for (const [meal, entries] of dateMap.entries()) {
        const initialLength = entries.length;
        const filtered = entries.filter(e => e.id !== entryId);

        if (filtered.length !== initialLength) {
          dateMap.set(meal, filtered);
          found = true;
          break;
        }
      }
      if (found) break;
    }

    if (found) {
      this.notifyListeners();
    }
  }

  /**
   * Update an existing entry
   */
  updateEntry(entry: WeekplanEntry): void {
    if (!entry.id || !entry.date || !entry.meal) {
      console.error('Entry must have id, date, and meal');
      return;
    }

    const dateMap = this.entriesStore.get(entry.date);
    if (!dateMap) return;

    const entries = dateMap.get(entry.meal);
    if (!entries) return;

    const index = entries.findIndex(e => e.id === entry.id);
    if (index !== -1) {
      entries[index] = entry;
      this.notifyListeners();
    }
  }

  /**
   * Clear all entries
   */
  clearEntries(): void {
    this.entriesStore.clear();
    this.notifyListeners();
  }

  /**
   * Set entries from API response
   */
  setEntries(entries: WeekplanEntry[]): void {
    this.entriesStore.clear();

    for (const entry of entries) {
      if (!this.entriesStore.has(entry.date)) {
        this.entriesStore.set(entry.date, new Map());
      }
      const dateMap = this.entriesStore.get(entry.date)!;
      if (!dateMap.has(entry.meal)) {
        dateMap.set(entry.meal, []);
      }
      dateMap.get(entry.meal)!.push(entry);
    }

    this.notifyListeners();
  }

  /**
   * Get current week offset
   */
  getWeekOffset(): number {
    return this.weekOffset;
  }

  /**
   * Set week offset
   */
  setWeekOffset(offset: number): void {
    if (this.weekOffset !== offset) {
      this.weekOffset = offset;
      this.notifyListeners();
    }
  }

  /**
   * Increment week offset (navigate forward)
   */
  incrementWeekOffset(): void {
    this.weekOffset++;
    this.notifyListeners();
  }

  /**
   * Decrement week offset (navigate backward)
   */
  decrementWeekOffset(): void {
    this.weekOffset--;
    this.notifyListeners();
  }

  /**
   * Subscribe to state changes
   * @returns Unsubscribe function
   */
  subscribe(listener: StateChangeListener): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  /**
   * Cleanup (for testing)
   */
  destroy(): void {
    this.entriesStore.clear();
    this.listeners.clear();
    this.weekOffset = 0;
  }
}

// Export singleton instance
export const weekplanState = new WeekplanStateManager();
