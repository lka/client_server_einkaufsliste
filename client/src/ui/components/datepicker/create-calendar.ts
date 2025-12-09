import { CalendarState } from './datepicker-types.js';
import { MONTHS_DE, WEEKDAYS_DE } from './date-utils.js';
import { isSameDay, isDateInRange, getFirstDayOfMonth, getDaysInMonth } from './date-utils.js';

/**
 * Create calendar grid for the current month
 */
function createCalendarGrid(state: CalendarState): HTMLElement {
  const grid = document.createElement('div');
  grid.className = 'datepicker-grid';

  // Weekday headers
  WEEKDAYS_DE.forEach(day => {
    const header = document.createElement('div');
    header.className = 'datepicker-weekday';
    header.textContent = day;
    grid.appendChild(header);
  });

  const firstDay = getFirstDayOfMonth(state.currentMonth);
  const daysInMonth = getDaysInMonth(state.currentMonth);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Prepare shopping dates - sort future dates ascending, past dates descending
  const futureDates: Date[] = [];
  const pastDates: Date[] = [];

  state.highlightDates.forEach(d => {
    const highlightDate = new Date(d);
    highlightDate.setHours(0, 0, 0, 0);

    if (highlightDate >= today) {
      futureDates.push(highlightDate);
    } else {
      pastDates.push(highlightDate);
    }
  });

  futureDates.sort((a, b) => a.getTime() - b.getTime());
  pastDates.sort((a, b) => b.getTime() - a.getTime()); // Descending for past

  // Additional colors for future shopping dates beyond the second
  const additionalColors = [
    '#a78bfa', // purple
    '#fb923c', // orange
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f59e0b', // amber
    '#8b5cf6', // violet
  ];

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'datepicker-day datepicker-day-empty';
    grid.appendChild(emptyCell);
  }

  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth(), day);
    const dayCell = document.createElement('button');
    dayCell.type = 'button';
    dayCell.className = 'datepicker-day';
    dayCell.textContent = String(day);
    dayCell.dataset.date = date.toISOString();

    // Check if this date is a shopping date
    const futureIndex = futureDates.findIndex(d => isSameDay(d, date));
    const pastIndex = pastDates.findIndex(d => isSameDay(d, date));

    if (futureIndex !== -1) {
      // Future shopping date
      if (futureIndex === 0) {
        // Next shopping day - yellow
        dayCell.classList.add('datepicker-day-shopping-next');
      } else if (futureIndex === 1) {
        // Second next shopping day - green
        dayCell.classList.add('datepicker-day-shopping-second');
      } else {
        // Additional future shopping days - various colors
        const colorIndex = (futureIndex - 2) % additionalColors.length;
        dayCell.classList.add('datepicker-day-shopping-future');
        dayCell.style.backgroundColor = additionalColors[colorIndex];
        dayCell.style.color = '#ffffff';
        dayCell.style.fontWeight = '600';
      }
    } else if (pastIndex !== -1) {
      // Past shopping date - grayscale
      dayCell.classList.add('datepicker-day-shopping-past');
    }

    // Add modifiers
    if (isSameDay(date, today)) {
      dayCell.classList.add('datepicker-day-today');
    }

    if (isSameDay(date, state.selectedDate)) {
      dayCell.classList.add('datepicker-day-selected');
      dayCell.setAttribute('aria-selected', 'true');
    }

    if (!isDateInRange(date, state.minDate, state.maxDate)) {
      dayCell.classList.add('datepicker-day-disabled');
      dayCell.disabled = true;
    }

    grid.appendChild(dayCell);
  }

  return grid;
}

/**
 * Create the calendar dropdown
 */
export function createCalendar(state: CalendarState, onSelect: (date: Date) => void): HTMLDivElement {
  const calendar = document.createElement('div');
  calendar.className = 'datepicker-calendar';
  calendar.setAttribute('role', 'dialog');
  calendar.setAttribute('aria-label', 'Datumsauswahl');

  // Header with month/year navigation
  const header = document.createElement('div');
  header.className = 'datepicker-header';

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'datepicker-nav-btn';
  prevBtn.innerHTML = '‹';
  prevBtn.setAttribute('aria-label', 'Vorheriger Monat');
  prevBtn.onclick = () => {
    state.currentMonth = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() - 1, 1);
    updateCalendar();
  };

  const monthYear = document.createElement('div');
  monthYear.className = 'datepicker-month-year';
  monthYear.textContent = `${MONTHS_DE[state.currentMonth.getMonth()]} ${state.currentMonth.getFullYear()}`;

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'datepicker-nav-btn';
  nextBtn.innerHTML = '›';
  nextBtn.setAttribute('aria-label', 'Nächster Monat');
  nextBtn.onclick = () => {
    state.currentMonth = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1, 1);
    updateCalendar();
  };

  header.appendChild(prevBtn);
  header.appendChild(monthYear);
  header.appendChild(nextBtn);
  calendar.appendChild(header);

  // Grid container
  const gridContainer = document.createElement('div');
  gridContainer.className = 'datepicker-grid-container';
  calendar.appendChild(gridContainer);

  // Today button
  const footer = document.createElement('div');
  footer.className = 'datepicker-footer';

  const todayBtn = document.createElement('button');
  todayBtn.type = 'button';
  todayBtn.className = 'datepicker-today-btn';
  todayBtn.textContent = 'Heute';
  todayBtn.onclick = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isDateInRange(today, state.minDate, state.maxDate)) {
      onSelect(today);
    }
  };

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'datepicker-clear-btn';
  clearBtn.textContent = 'Löschen';
  clearBtn.onclick = () => {
    onSelect(null as any);
  };

  footer.appendChild(todayBtn);
  footer.appendChild(clearBtn);
  calendar.appendChild(footer);

  // Update function
  const updateCalendar = () => {
    monthYear.textContent = `${MONTHS_DE[state.currentMonth.getMonth()]} ${state.currentMonth.getFullYear()}`;
    const newGrid = createCalendarGrid(state);

    // Add click handlers to day cells
    newGrid.querySelectorAll('.datepicker-day:not(.datepicker-day-empty):not(.datepicker-day-disabled)').forEach(dayCell => {
      (dayCell as HTMLButtonElement).onclick = () => {
        const dateStr = (dayCell as HTMLElement).dataset.date;
        if (dateStr) {
          onSelect(new Date(dateStr));
        }
      };
    });

    gridContainer.innerHTML = '';
    gridContainer.appendChild(newGrid);
  };

  updateCalendar();

  return calendar;
}
