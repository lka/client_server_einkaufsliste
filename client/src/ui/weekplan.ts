/**
 * Weekplan UI Module
 * Manages the weekly planning view with navigation and day columns
 */

import { getWeekplanEntries, createWeekplanEntry, deleteWeekplanEntry, getWeekplanSuggestions, WeekplanEntry } from '../data/api.js';
import { onWeekplanAdded, onWeekplanDeleted, broadcastWeekplanAdd, broadcastWeekplanDelete } from '../data/websocket.js';
import { printWeekplan } from './print-utils.js';
import { Autocomplete } from './components/autocomplete.js';

// Store entries by date and meal
const entriesStore: Map<string, Map<string, WeekplanEntry[]>> = new Map();

/**
 * Get the ISO week number for a given date
 */
function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Get Monday of the week for a given date
 */
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(d.setDate(diff));
}

/**
 * Format date as DD.MM.
 */
function formatShortDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}.`;
}

/**
 * Current week offset (0 = current week, -1 = previous week, +1 = next week)
 */
let weekOffset = 0;

/**
 * Format date as YYYY-MM-DD for API
 */
function formatISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Render the week display and update day columns
 */
async function renderWeek(): Promise<void> {
  const today = new Date();
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + (weekOffset * 7));

  const monday = getMonday(targetDate);
  const weekNumber = getISOWeek(monday);
  const year = monday.getFullYear();

  // Calculate date range for the week
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    dates.push(day);
  }

  const startDateStr = formatShortDate(dates[0]);
  const endDateStr = formatShortDate(dates[6]);

  // Update week display
  const weekDisplay = document.getElementById('weekDisplay');
  if (weekDisplay) {
    weekDisplay.textContent = `KW ${weekNumber} · ${startDateStr} - ${endDateStr}${year}`;
  }

  // Load entries for this week
  const weekStartISO = formatISODate(monday);
  try {
    const entries = await getWeekplanEntries(weekStartISO);

    // Clear and rebuild entries store
    entriesStore.clear();
    for (const entry of entries) {
      if (!entriesStore.has(entry.date)) {
        entriesStore.set(entry.date, new Map());
      }
      const dateMap = entriesStore.get(entry.date)!;
      if (!dateMap.has(entry.meal)) {
        dateMap.set(entry.meal, []);
      }
      dateMap.get(entry.meal)!.push(entry);
    }
  } catch (error) {
    console.error('Failed to load weekplan entries:', error);
  }

  // Update day columns
  const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const todayStr = formatShortDate(today);

  dayNames.forEach((dayName, index) => {
    const dayColumn = document.querySelector(`.day-column[data-day="${dayName}"]`);
    if (dayColumn) {
      const dayHeader = dayColumn.querySelector('.day-header');
      const dateSpan = dayColumn.querySelector('.day-date');
      if (dateSpan) {
        const currentDateStr = formatShortDate(dates[index]);
        dateSpan.textContent = currentDateStr;

        // Add 'today' class if this is today's date
        if (dayHeader) {
          if (currentDateStr === todayStr) {
            dayHeader.classList.add('today');
          } else {
            dayHeader.classList.remove('today');
          }
        }
      }

      // Render entries for each meal section
      const dateISO = formatISODate(dates[index]);
      const meals = ['morning', 'lunch', 'dinner'];
      meals.forEach(meal => {
        const mealSection = dayColumn.querySelector(`.meal-section[data-meal="${meal}"]`);
        if (mealSection) {
          const mealContent = mealSection.querySelector('.meal-content');
          if (mealContent) {
            // Clear existing entries
            mealContent.querySelectorAll('.meal-item').forEach(item => item.remove());

            // Add entries from store
            const dateEntries = entriesStore.get(dateISO);
            if (dateEntries) {
              const mealEntries = dateEntries.get(meal);
              if (mealEntries) {
                mealEntries.forEach(entry => {
                  addMealItemToDOM(mealContent, entry.text, entry.id!);
                });
              }
            }
          }
        }
      });
    }
  });
}

/**
 * Navigate to previous week
 */
function navigateToPreviousWeek(): void {
  weekOffset--;
  renderWeek();
}

/**
 * Navigate to next week
 */
function navigateToNextWeek(): void {
  weekOffset++;
  renderWeek();
}

/**
 * Handle print weekplan button click
 */
function handlePrintWeekplan(): void {
  const today = new Date();
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + (weekOffset * 7));

  const monday = getMonday(targetDate);
  const weekNumber = getISOWeek(monday);
  const year = monday.getFullYear();

  // Calculate date range for the week
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    dates.push(day);
  }

  // Build entries map for printing - always include all 7 days
  const printEntries = new Map<string, Map<string, Array<{ id: number; text: string }>>>();

  for (let i = 0; i < 7; i++) {
    const dateISO = formatISODate(dates[i]);
    const dateEntries = entriesStore.get(dateISO);
    const dayPrintEntries = new Map<string, Array<{ id: number; text: string }>>();

    ['morning', 'lunch', 'dinner'].forEach(meal => {
      const mealEntries = dateEntries?.get(meal);
      if (mealEntries && mealEntries.length > 0) {
        dayPrintEntries.set(meal, mealEntries.map(e => ({ id: e.id!, text: e.text })));
      }
    });

    // Always add the date to the map, even if there are no entries
    printEntries.set(dateISO, dayPrintEntries);
  }

  // Call print function
  printWeekplan(weekNumber, year, printEntries);
}

/**
 * Handle adding a meal entry
 */
async function handleAddMealEntry(event: Event): Promise<void> {
  const button = event.target as HTMLButtonElement;
  const mealSection = button.closest('.meal-section');
  const mealContent = mealSection?.querySelector('.meal-content');
  const dayColumn = button.closest('.day-column');

  if (!mealContent || !mealSection || !dayColumn) return;

  const meal = mealSection.getAttribute('data-meal');
  const dayName = dayColumn.getAttribute('data-day');

  if (!meal || !dayName) return;

  // Check if there's already an input field
  const existingInput = mealContent.querySelector('.meal-input') as HTMLInputElement;
  if (existingInput) {
    // If there's content, save it first, then create a new input
    if (existingInput.value.trim()) {
      const textToSave = existingInput.value.trim();
      const existingWrapper = existingInput.closest('div');

      // Disable the input to prevent double-submission
      existingInput.disabled = true;

      // Calculate full date from displayed date
      const today = new Date();
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + (weekOffset * 7));
      const monday = getMonday(targetDate);

      const dayIndex = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].indexOf(dayName);
      const date = new Date(monday);
      date.setDate(monday.getDate() + dayIndex);
      const dateISO = formatISODate(date);

      try {
        const entry = await createWeekplanEntry({
          date: dateISO,
          meal: meal,
          text: textToSave
        });

        // Add to store
        if (!entriesStore.has(dateISO)) {
          entriesStore.set(dateISO, new Map());
        }
        const dateMap = entriesStore.get(dateISO)!;
        if (!dateMap.has(meal)) {
          dateMap.set(meal, []);
        }
        dateMap.get(meal)!.push(entry);

        // Add to DOM
        addMealItemToDOM(mealContent, entry.text, entry.id!);

        // Remove the existing input wrapper
        if (existingWrapper) {
          existingWrapper.remove();
        }

        // Broadcast to other users via WebSocket
        broadcastWeekplanAdd(entry);

        // Continue to create a new input below
      } catch (error) {
        console.error('Failed to create entry:', error);
        existingInput.disabled = false;
        alert('Fehler beim Speichern des Eintrags');
        return; // Don't create a new input if save failed
      }
    } else {
      // Empty input, just focus it
      existingInput.focus();
      return;
    }
  }

  // Create wrapper for input and autocomplete
  const inputWrapper = document.createElement('div');
  inputWrapper.style.cssText = `
    position: relative;
    margin-bottom: 0.5rem;
  `;

  // Create input field
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'meal-input';
  input.placeholder = 'Eintrag hinzufügen...';
  input.style.cssText = `
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.9rem;
  `;

  inputWrapper.appendChild(input);

  // Function to save the entry
  const saveEntry = async (text: string) => {
    if (!text.trim()) return;

    input.disabled = true;

    // Calculate full date from displayed date
    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + (weekOffset * 7));
    const monday = getMonday(targetDate);

    const dayIndex = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].indexOf(dayName);
    const date = new Date(monday);
    date.setDate(monday.getDate() + dayIndex);
    const dateISO = formatISODate(date);

    try {
      const entry = await createWeekplanEntry({
        date: dateISO,
        meal: meal,
        text: text.trim()
      });

      // Add to store
      if (!entriesStore.has(dateISO)) {
        entriesStore.set(dateISO, new Map());
      }
      const dateMap = entriesStore.get(dateISO)!;
      if (!dateMap.has(meal)) {
        dateMap.set(meal, []);
      }
      dateMap.get(meal)!.push(entry);

      // Add to DOM
      addMealItemToDOM(mealContent, entry.text, entry.id!);
      autocomplete.destroy();
      inputWrapper.remove();

      // Broadcast to other users via WebSocket
      broadcastWeekplanAdd(entry);
    } catch (error) {
      console.error('Failed to create entry:', error);
      input.disabled = false;
      alert('Fehler beim Speichern des Eintrags');
    }
  };

  // Initialize Autocomplete for entry suggestions
  const autocomplete = new Autocomplete({
    input,
    onSearch: async (query: string) => {
      const suggestions = await getWeekplanSuggestions(query, 5);
      return suggestions.map(text => ({
        id: text,
        label: text,
        data: text,
      }));
    },
    onSelect: (suggestion) => {
      // Save entry immediately when suggestion is selected
      saveEntry(suggestion.label);
    },
    debounceMs: 300,
    minChars: 2,
    maxSuggestions: 5,
  });

  // Add entry on Enter key
  input.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter' && input.value.trim()) {
      await saveEntry(input.value);
    } else if (e.key === 'Escape') {
      autocomplete.destroy();
      inputWrapper.remove();
    }
  });

  // Remove input on blur if empty
  input.addEventListener('blur', () => {
    setTimeout(() => {
      if (!input.value.trim()) {
        autocomplete.destroy();
        inputWrapper.remove();
      }
    }, 200);
  });

  mealContent.insertBefore(inputWrapper, mealContent.firstChild);
  input.focus();
}

/**
 * Add a meal item to the DOM
 */
function addMealItemToDOM(container: Element, text: string, entryId: number): void {
  const item = document.createElement('div');
  item.className = 'meal-item';
  item.dataset.entryId = String(entryId);
  item.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.4rem 0.6rem;
    background: white;
    border-radius: 4px;
    margin-bottom: 0.3rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  `;

  const span = document.createElement('span');
  span.textContent = text;
  span.style.cssText = 'flex: 1; font-size: 0.9rem;';

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = '🗑️';
  deleteBtn.className = 'delete-meal-item';
  deleteBtn.style.cssText = `
    background: transparent;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.6;
    transition: opacity 0.2s;
    filter: grayscale(100%);
  `;
  deleteBtn.addEventListener('mouseover', () => {
    deleteBtn.style.opacity = '1';
    deleteBtn.style.filter = 'grayscale(0%)';
  });
  deleteBtn.addEventListener('mouseout', () => {
    deleteBtn.style.opacity = '0.6';
    deleteBtn.style.filter = 'grayscale(100%)';
  });
  deleteBtn.addEventListener('click', async () => {
    deleteBtn.disabled = true;
    try {
      await deleteWeekplanEntry(entryId);

      // Remove from store
      for (const dateMap of entriesStore.values()) {
        for (const entries of dateMap.values()) {
          const index = entries.findIndex(e => e.id === entryId);
          if (index !== -1) {
            entries.splice(index, 1);
            break;
          }
        }
      }

      // Remove from DOM
      item.remove();

      // Broadcast to other users via WebSocket
      broadcastWeekplanDelete(entryId);
    } catch (error) {
      console.error('Failed to delete entry:', error);
      deleteBtn.disabled = false;
      alert('Fehler beim Löschen des Eintrags');
    }
  });

  item.appendChild(span);
  item.appendChild(deleteBtn);
  container.appendChild(item);
}

/**
 * Handle incoming WebSocket event for weekplan entry added
 */
function handleWeekplanAdded(data: WeekplanEntry): void {
  // Add to store
  if (!entriesStore.has(data.date)) {
    entriesStore.set(data.date, new Map());
  }
  const dateMap = entriesStore.get(data.date)!;
  if (!dateMap.has(data.meal)) {
    dateMap.set(data.meal, []);
  }
  dateMap.get(data.meal)!.push(data);

  // Find the correct meal section and add to DOM
  const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  // Calculate which day of the week this date is
  const entryDate = new Date(data.date);
  const dayOfWeek = entryDate.getDay();
  const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday=0 to index 6
  const dayName = dayNames[dayIndex];

  const dayColumn = document.querySelector(`.day-column[data-day="${dayName}"]`);
  if (dayColumn) {
    const mealSection = dayColumn.querySelector(`.meal-section[data-meal="${data.meal}"]`);
    if (mealSection) {
      const mealContent = mealSection.querySelector('.meal-content');
      if (mealContent) {
        addMealItemToDOM(mealContent, data.text, data.id!);
      }
    }
  }
}

/**
 * Handle incoming WebSocket event for weekplan entry deleted
 */
function handleWeekplanDeleted(data: { id: number }): void {
  // Remove from store
  for (const dateMap of entriesStore.values()) {
    for (const entries of dateMap.values()) {
      const index = entries.findIndex(e => e.id === data.id);
      if (index !== -1) {
        entries.splice(index, 1);
        break;
      }
    }
  }

  // Remove from DOM
  const item = document.querySelector(`.meal-item[data-entry-id="${data.id}"]`);
  if (item) {
    item.remove();
  }
}

/**
 * Initialize weekplan UI
 */
export function initWeekplan(): void {
  // Render current week
  renderWeek();

  // Attach event listeners for navigation
  const prevWeekBtn = document.getElementById('prevWeekBtn');
  const nextWeekBtn = document.getElementById('nextWeekBtn');
  const printWeekBtn = document.getElementById('printWeekBtn');

  if (prevWeekBtn) {
    prevWeekBtn.addEventListener('click', navigateToPreviousWeek);
  }

  if (nextWeekBtn) {
    nextWeekBtn.addEventListener('click', navigateToNextWeek);
  }

  if (printWeekBtn) {
    printWeekBtn.addEventListener('click', handlePrintWeekplan);
  }

  // Attach event listeners for add meal buttons
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    if (target.classList.contains('add-meal-btn')) {
      handleAddMealEntry(event);
    }
  });

  // Subscribe to WebSocket events
  onWeekplanAdded((data: any) => {
    handleWeekplanAdded(data);
  });

  onWeekplanDeleted((data: { id: number }) => {
    handleWeekplanDeleted(data);
  });
}
