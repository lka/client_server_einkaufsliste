/**
 * Weekplan UI Module
 * Manages the weekly planning view with navigation and day columns
 */

import { getWeekplanEntries, type WeekplanEntry } from '../data/api.js';
import { onWeekplanAdded, onWeekplanDeleted } from '../data/websocket.js';

// Import weekplan modules
import {
  weekplanState,
  getISOWeek,
  getMonday,
  formatShortDate,
  formatISODate,
  navigateToPreviousWeek,
  navigateToNextWeek,
  handleAddMealEntry,
  addMealItemToDOM,
  handlePrintWeekplan,
  initializeWeekplanWebSocket,
  showTemplateDetails,
  showRecipeDetailsById,
  DAY_NAMES,
  MEAL_TYPES
} from './weekplan/index.js';

/**
 * Render the week display and update day columns
 */
async function renderWeek(): Promise<void> {
  const today = new Date();
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + (weekplanState.getWeekOffset() * 7));

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

    // Update weekplan state
    weekplanState.setEntries(entries);
  } catch (error) {
    console.error('Failed to load weekplan entries:', error);
  }

  // Update day columns
  const todayStr = formatShortDate(today);

  DAY_NAMES.forEach((dayName, index) => {
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
      MEAL_TYPES.forEach(meal => {
        const mealSection = dayColumn.querySelector(`.meal-section[data-meal="${meal}"]`);
        if (mealSection) {
          const mealContent = mealSection.querySelector('.meal-content');
          if (mealContent) {
            // Clear existing entries
            mealContent.querySelectorAll('.meal-item').forEach(item => item.remove());

            // Add entries from state
            const mealEntries = weekplanState.getEntries(dateISO, meal);
            if (mealEntries) {
              mealEntries.forEach((entry: WeekplanEntry) => {
                addMealItemToDOM(mealContent, entry.text, entry.id!, entry.recipe_id);
              });
            }
          }
        }
      });
    }
  });
}

// Navigation functions - local wrappers to call renderWeek after navigation
function navigateToPreviousWeekLocal(): void {
  navigateToPreviousWeek();
  renderWeek();
}

function navigateToNextWeekLocal(): void {
  navigateToNextWeek();
  renderWeek();
}

/**
 * Handle incoming WebSocket event for weekplan entry added
 */
function handleWeekplanAdded(data: WeekplanEntry): void {
  // Add to state
  weekplanState.addEntry(data);

  // Find the correct meal section and add to DOM
  // Calculate which day of the week this date is
  const entryDate = new Date(data.date);
  const dayOfWeek = entryDate.getDay();
  const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday=0 to index 6
  const dayName = DAY_NAMES[dayIndex];

  const dayColumn = document.querySelector(`.day-column[data-day="${dayName}"]`);
  if (dayColumn) {
    const mealSection = dayColumn.querySelector(`.meal-section[data-meal="${data.meal}"]`);
    if (mealSection) {
      const mealContent = mealSection.querySelector('.meal-content');
      if (mealContent && data.id) {
        addMealItemToDOM(mealContent, data.text, data.id, data.recipe_id);
      }
    }
  }
}

/**
 * Handle incoming WebSocket event for weekplan entry deleted
 */
function handleWeekplanDeleted(data: { id: number }): void {
  // Remove from state
  weekplanState.removeEntry(data.id);

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
  // Initialize WebSocket integration
  initializeWeekplanWebSocket();

  // Render current week
  renderWeek();

  // Attach event listeners for navigation
  const prevWeekBtn = document.getElementById('prevWeekBtn');
  const nextWeekBtn = document.getElementById('nextWeekBtn');
  const printWeekBtn = document.getElementById('printWeekBtn');

  if (prevWeekBtn) {
    prevWeekBtn.addEventListener('click', navigateToPreviousWeekLocal);
  }

  if (nextWeekBtn) {
    nextWeekBtn.addEventListener('click', navigateToNextWeekLocal);
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

  // Handle clicks on meal items to show details
  document.addEventListener('weekplan:show-details', async (event: Event) => {
    const customEvent = event as CustomEvent;
    const { text, entryId, recipeId } = customEvent.detail;

    if (recipeId) {
      // Show recipe details
      await showRecipeDetailsById(recipeId, entryId);
    } else {
      // Try to show template details
      try {
        await showTemplateDetails(text, entryId);
      } catch (error) {
        // Not a template or recipe, do nothing
        console.log('Not a template:', text);
      }
    }
  });

  // Subscribe to WebSocket events
  onWeekplanAdded((data: WeekplanEntry) => {
    handleWeekplanAdded(data);
  });

  onWeekplanDeleted((data: { id: number }) => {
    handleWeekplanDeleted(data);
  });
}
