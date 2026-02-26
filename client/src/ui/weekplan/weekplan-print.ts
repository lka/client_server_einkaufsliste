/**
 * Print functionality for weekplan
 */

import { printWeekplan, printTwoWeekplans } from '../print-utils/index.js';
import { weekplanState } from '../../state/weekplan-state.js';
import { getCurrentWeekInfo } from './weekplan-navigation.js';
import { formatISODate, getISOWeek, getWeekDates } from './weekplan-utils.js';
import { MEAL_TYPES } from './types.js';
import { Modal } from '../components/modal.js';
import { getWeekplanEntries } from '../../data/api/weekplan-api.js';
import type { WeekplanEntry } from '../../data/api/types.js';
import { showError } from '../components/toast.js';

type PrintEntries = Map<string, Map<string, Array<{ id: number; text: string }>>>;

/**
 * Build print entries map from weekplan state for the given dates
 */
function buildPrintEntries(dates: Date[]): PrintEntries {
  const printEntries: PrintEntries = new Map();

  for (let i = 0; i < 7; i++) {
    const dateISO = formatISODate(dates[i]);
    const dateEntries = weekplanState.getDateEntries(dateISO);
    const dayPrintEntries = new Map<string, Array<{ id: number; text: string }>>();

    MEAL_TYPES.forEach(meal => {
      const mealEntries = dateEntries.get(meal);
      if (mealEntries && mealEntries.length > 0) {
        dayPrintEntries.set(meal, mealEntries.map(e => ({ id: e.id!, text: e.text })));
      }
    });

    printEntries.set(dateISO, dayPrintEntries);
  }

  return printEntries;
}

/**
 * Build print entries map from raw API entries
 */
function buildPrintEntriesFromApi(dates: Date[], apiEntries: WeekplanEntry[]): PrintEntries {
  const printEntries: PrintEntries = new Map();

  for (let i = 0; i < 7; i++) {
    const dateISO = formatISODate(dates[i]);
    const dayPrintEntries = new Map<string, Array<{ id: number; text: string }>>();

    MEAL_TYPES.forEach(meal => {
      const mealEntries = apiEntries.filter(e => e.date === dateISO && e.meal === meal);
      if (mealEntries.length > 0) {
        dayPrintEntries.set(meal, mealEntries.map(e => ({ id: e.id!, text: e.text })));
      }
    });

    printEntries.set(dateISO, dayPrintEntries);
  }

  return printEntries;
}

/**
 * Create a styled print option button
 */
function createPrintOptionButton(title: string, subtitle: string): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.style.cssText =
    'display:flex;flex-direction:column;align-items:flex-start;padding:0.75rem 1rem;' +
    'width:100%;border:1px solid #ddd;border-radius:6px;background:white;cursor:pointer;' +
    'text-align:left;transition:background 0.15s;';

  const titleEl = document.createElement('strong');
  titleEl.textContent = title;

  const subtitleEl = document.createElement('small');
  subtitleEl.textContent = subtitle;
  subtitleEl.style.cssText = 'color:#666;margin-top:0.2rem;display:block;font-weight:normal;';

  btn.appendChild(titleEl);
  btn.appendChild(subtitleEl);

  btn.addEventListener('mouseover', () => { btn.style.background = '#f5f5f5'; });
  btn.addEventListener('mouseout', () => { btn.style.background = 'white'; });

  return btn;
}

/**
 * Show print options dialog and handle the selected print mode
 */
export function handlePrintWeekplan(): void {
  const btn1 = createPrintOptionButton(
    'Nur diese Woche',
    'Aktuelle Woche auf einer Seite'
  );
  const btn2 = createPrintOptionButton(
    'Diese + nächste Woche',
    'Vorderseite: aktuelle Woche · Rückseite: nächste Woche (Duplex)'
  );

  const container = document.createElement('div');
  container.style.cssText = 'display:flex;flex-direction:column;gap:0.75rem;padding:0.25rem 0;';
  container.appendChild(btn1);
  container.appendChild(btn2);

  const modal = new Modal({
    title: 'Wochenplan drucken',
    content: container,
    size: 'small',
  });

  modal.open();

  btn1.addEventListener('click', () => {
    modal.close();
    const { weekNumber, year, dates } = getCurrentWeekInfo();
    printWeekplan(weekNumber, year, buildPrintEntries(dates));
  });

  btn2.addEventListener('click', async () => {
    modal.close();
    await printDuplexWeeks();
  });
}

/**
 * Fetch next week's data and print both weeks for duplex printing
 */
async function printDuplexWeeks(): Promise<void> {
  const { weekNumber, year, dates, monday } = getCurrentWeekInfo();
  const currentEntries = buildPrintEntries(dates);

  const nextMonday = new Date(monday);
  nextMonday.setDate(nextMonday.getDate() + 7);
  const nextWeekNumber = getISOWeek(nextMonday);
  const nextYear = nextMonday.getFullYear();
  const nextDates = getWeekDates(nextMonday);
  const nextWeekStart = formatISODate(nextMonday);

  try {
    const apiEntries = await getWeekplanEntries(nextWeekStart);
    const nextEntries = buildPrintEntriesFromApi(nextDates, apiEntries);
    printTwoWeekplans(weekNumber, year, currentEntries, nextWeekNumber, nextYear, nextEntries);
  } catch (error) {
    console.error('Error fetching next week entries:', error);
    showError('Nächste Woche konnte nicht geladen werden.');
  }
}
