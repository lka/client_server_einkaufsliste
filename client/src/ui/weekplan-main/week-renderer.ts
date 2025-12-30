/**
 * Week rendering logic for weekplan
 */

import { getWeekplanEntries, type WeekplanEntry } from '../../data/api.js';
import {
  weekplanState,
  getISOWeek,
  getMonday,
  formatShortDate,
  formatISODate,
  addMealItemToDOM,
  DAY_NAMES,
  MEAL_TYPES
} from '../weekplan/index.js';

/**
 * Render the week display and update day columns
 */
export async function renderWeek(): Promise<void> {
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
                addMealItemToDOM(mealContent, entry.text, entry.id!, entry.recipe_id, entry.template_id, entry.entry_type);
              });
            }
          }
        }
      });
    }
  });
}
