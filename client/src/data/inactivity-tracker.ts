/**
 * Inactivity Tracker
 *
 * Tracks user activity and automatically logs out after a period of inactivity.
 * The inactivity timeout is based on the token expiration time from the server.
 */

import { logout, isAuthenticated } from './auth.js';

let inactivityTimeout: number | null = null;
let inactivityTimeoutMs: number = 30 * 60 * 1000; // Default: 30 minutes
let isTrackerActive: boolean = false;

// Events that indicate user activity
const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keypress',
  'scroll',
  'touchstart',
  'click',
];

/**
 * Initialize inactivity tracker with token expiration time
 * @param expiresInSeconds Token expiration time in seconds
 */
export function initInactivityTracker(expiresInSeconds: number): void {
  if (!isAuthenticated()) {
    return;
  }

  // Convert seconds to milliseconds
  inactivityTimeoutMs = expiresInSeconds * 1000;

  // Reset the timer
  resetInactivityTimer();

  // Only add event listeners if not already active
  // This prevents duplicate listeners when navigating between pages
  if (!isTrackerActive) {
    ACTIVITY_EVENTS.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });
    isTrackerActive = true;
  }
}

/**
 * Stop inactivity tracking
 */
export function stopInactivityTracker(): void {
  // Remove event listeners
  ACTIVITY_EVENTS.forEach(event => {
    window.removeEventListener(event, handleActivity);
  });

  // Clear timeout
  if (inactivityTimeout) {
    clearTimeout(inactivityTimeout);
    inactivityTimeout = null;
  }

  // Mark tracker as inactive
  isTrackerActive = false;

  console.log('Inactivity tracker stopped');
}

/**
 * Handle user activity
 */
function handleActivity(): void {
  resetInactivityTimer();
}

/**
 * Reset the inactivity timer
 * This function is exported so it can be called from API operations
 */
export function resetInactivityTimer(): void {
  // Clear existing timeout
  if (inactivityTimeout) {
    clearTimeout(inactivityTimeout);
  }

  // Set new timeout
  inactivityTimeout = window.setTimeout(() => {
    handleInactivityTimeout();
  }, inactivityTimeoutMs);
}

/**
 * Handle inactivity timeout - logout user
 */
function handleInactivityTimeout(): void {
  console.log('User inactive - logging out');

  // Stop tracking
  stopInactivityTracker();

  // Clear authentication
  logout();

  // Clear browser history
  clearBrowserHistory();

  // Redirect to login with message
  alert('Sie wurden aufgrund von Inaktivität abgemeldet.');
  window.location.href = '/';
}

/**
 * Clear browser history
 */
function clearBrowserHistory(): void {
  try {
    // Clear session storage
    sessionStorage.clear();

    // Clear all history entries (except current page)
    const historyLength = window.history.length;

    // Go back to the first entry, then replace with login page
    // This effectively clears the forward history
    if (historyLength > 1) {
      window.history.go(-(historyLength - 1));
    }

    // Note: We cannot actually delete history entries for security reasons,
    // but we can prevent back navigation by replacing the state
    window.history.replaceState(null, '', '/');

    console.log('Browser history cleared');
  } catch (error) {
    console.error('Error clearing browser history:', error);
  }
}

/**
 * Get remaining time until inactivity timeout (in seconds)
 */
export function getRemainingTime(): number {
  // This is an approximation as we don't track the exact start time
  return Math.floor(inactivityTimeoutMs / 1000);
}
