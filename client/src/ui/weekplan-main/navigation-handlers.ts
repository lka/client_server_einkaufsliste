/**
 * Navigation handlers for weekplan
 */

import { navigateToPreviousWeek, navigateToNextWeek } from '../weekplan/index.js';
import { renderWeek } from './week-renderer.js';

/**
 * Navigate to previous week and re-render
 */
export function navigateToPreviousWeekLocal(): void {
  navigateToPreviousWeek();
  renderWeek();
}

/**
 * Navigate to next week and re-render
 */
export function navigateToNextWeekLocal(): void {
  navigateToNextWeek();
  renderWeek();
}
