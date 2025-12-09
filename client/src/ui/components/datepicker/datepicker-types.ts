export interface CalendarState {
  currentMonth: Date;
  selectedDate: Date | null;
  minDate: Date | null;
  maxDate: Date | null;
  highlightDates: Date[];
}

