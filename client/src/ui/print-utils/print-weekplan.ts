import { showError } from '../components/toast.js';
import { isAndroid } from './is-android.js';

type PrintEntries = Map<string, Map<string, Array<{ id: number; text: string }>>>;

/**
 * Build HTML table for a weekplan
 */
function buildWeekTableHTML(entries: PrintEntries): string {
  const dayNames = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
  const dates = Array.from(entries.keys()).sort();

  let tableHTML = '<table>';

  tableHTML += '<thead><tr>';
  dayNames.forEach((day, dayIndex) => {
    const date = dates[dayIndex];
    let dateStr = '';
    if (date) {
      const parts = date.split('-');
      dateStr = `${parts[2]}.${parts[1]}.`;
    }
    tableHTML += `<th class="day-header"><div class="day-name">${day}</div><div class="day-date">${dateStr}</div></th>`;
  });
  tableHTML += '</tr></thead><tbody>';

  ['morning', 'lunch', 'dinner'].forEach(meal => {
    tableHTML += '<tr>';

    dayNames.forEach((_, dayIndex) => {
      const date = dates[dayIndex];
      const mealEntries = date && entries.get(date)?.get(meal);

      tableHTML += '<td class="meal-cell">';

      if (mealEntries && mealEntries.length > 0) {
        tableHTML += '<ul>';
        mealEntries.forEach(entry => {
          tableHTML += `<li>${escapeHtml(entry.text)}</li>`;
        });
        tableHTML += '</ul>';
      }
      tableHTML += '</td>';
    });

    tableHTML += '</tr>';
  });

  tableHTML += '</tbody></table>';
  return tableHTML;
}

/**
 * Print weekplan as table in landscape A4 format
 * @param weekNumber - Calendar week number (e.g., 5)
 * @param year - Year (e.g., 2025)
 * @param entries - Map of date -> meal -> entries
 */
export function printWeekplan(
  weekNumber: number,
  year: number,
  entries: PrintEntries
): void {
  const tableHTML = buildWeekTableHTML(entries);

  if (isAndroid()) {
    printWeekplanInline(weekNumber, year, tableHTML);
  } else {
    printWeekplanPopup(weekNumber, year, tableHTML);
  }
}

/**
 * Print two weekplans (front/back for duplex printing)
 * @param week1Number - Current week number
 * @param year1 - Current week year
 * @param entries1 - Current week entries
 * @param week2Number - Next week number
 * @param year2 - Next week year
 * @param entries2 - Next week entries
 */
export function printTwoWeekplans(
  week1Number: number,
  year1: number,
  entries1: PrintEntries,
  week2Number: number,
  year2: number,
  entries2: PrintEntries
): void {
  const table1HTML = buildWeekTableHTML(entries1);
  const table2HTML = buildWeekTableHTML(entries2);

  if (isAndroid()) {
    printTwoWeekplansInline(week1Number, year1, table1HTML, week2Number, year2, table2HTML);
  } else {
    printTwoWeekplansPopup(week1Number, year1, table1HTML, week2Number, year2, table2HTML);
  }
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Print weekplan inline (for Android)
 */
function printWeekplanInline(
  weekNumber: number,
  year: number,
  tableHTML: string
): void {
  document.title = `Wochenplan KW ${weekNumber} ${year}`;

  document.body.innerHTML = `
    <style>
      ${getWeekplanPrintStyles()}
    </style>
    <div class="weekplan-print">
      <div class="weekplan-header">
        <h1>Wochenplan KW ${weekNumber} ${year}</h1>
      </div>
      ${tableHTML}
    </div>
  `;

  // Trigger print
  setTimeout(() => {
    window.print();

    // Note: On Android, user will need to reload the page after printing
    // to restore the original view
  }, 300);
}

/**
 * Print two weekplans inline (for Android, duplex)
 */
function printTwoWeekplansInline(
  week1Number: number,
  year1: number,
  table1HTML: string,
  week2Number: number,
  year2: number,
  table2HTML: string
): void {
  document.title = `Wochenplan KW ${week1Number} ${year1} + KW ${week2Number} ${year2}`;

  document.body.innerHTML = `
    <style>
      ${getWeekplanPrintStyles()}
    </style>
    <div class="weekplan-print">
      <div class="weekplan-header">
        <h1>Wochenplan KW ${week1Number} ${year1}</h1>
      </div>
      ${table1HTML}
    </div>
    <div class="page-break"></div>
    <div class="weekplan-print">
      <div class="weekplan-header">
        <h1>Wochenplan KW ${week2Number} ${year2}</h1>
      </div>
      ${table2HTML}
    </div>
  `;

  setTimeout(() => {
    window.print();
  }, 300);
}

/**
 * Print two weekplans in popup (Desktop/iOS, duplex)
 */
function printTwoWeekplansPopup(
  week1Number: number,
  year1: number,
  table1HTML: string,
  week2Number: number,
  year2: number,
  table2HTML: string
): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    showError('Popup-Blocker verhindert das Drucken. Bitte erlauben Sie Popups für diese Seite.');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Wochenplan KW ${week1Number} ${year1} + KW ${week2Number} ${year2}</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          ${getWeekplanPrintStyles()}
        </style>
      </head>
      <body>
        <div class="print-hint">
          <strong>📱 Druckhinweis:</strong> Bitte wählen Sie im Druckdialog <strong>Querformat (Landscape)</strong> und <strong>Duplex (beidseitig, kurze Seite umwenden)</strong>!
        </div>
        <div class="weekplan-print">
          <div class="weekplan-header">
            <h1>Wochenplan KW ${week1Number} ${year1}</h1>
          </div>
          ${table1HTML}
        </div>
        <div class="page-break"></div>
        <div class="weekplan-print">
          <div class="weekplan-header">
            <h1>Wochenplan KW ${week2Number} ${year2}</h1>
          </div>
          ${table2HTML}
        </div>
      </body>
    </html>
  `);

  printWindow.document.close();

  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      setTimeout(() => {
        printWindow.close();
      }, 100);
    }, 250);
  };
}

/**
 * Print weekplan popup (for Desktop/iOS)
 */
function printWeekplanPopup(
  weekNumber: number,
  year: number,
  tableHTML: string
): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    showError('Popup-Blocker verhindert das Drucken. Bitte erlauben Sie Popups für diese Seite.');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Wochenplan KW ${weekNumber} ${year}</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          ${getWeekplanPrintStyles()}
        </style>
      </head>
      <body>
        <div class="print-hint">
          <strong>📱 Druckhinweis:</strong> Bitte wählen Sie im Druckdialog <strong>Querformat (Landscape)</strong> für optimale Darstellung!
        </div>
        <div class="weekplan-print">
          <div class="weekplan-header">
            <h1>Wochenplan KW ${weekNumber} ${year}</h1>
          </div>
          ${tableHTML}
        </div>
      </body>
    </html>
  `);

  printWindow.document.close();

  // Trigger print after load
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      setTimeout(() => {
        printWindow.close();
      }, 100);
    }, 250);
  };
}

/**
 * Get CSS styles for weekplan printing (DIN A4 landscape)
 */
function getWeekplanPrintStyles(): string {
  return `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: Arial, sans-serif;
      padding: 10mm;
      background: white;
      color: #000;
    }

    .print-hint {
      background: #fff3cd;
      padding: 10px;
      margin-bottom: 15px;
      border: 1px solid #ffc107;
      border-radius: 4px;
      text-align: center;
      font-size: 14px;
    }

    .weekplan-print {
      width: 100%;
      max-width: 297mm;
    }

    .weekplan-header {
      text-align: center;
      margin-bottom: 15px;
    }

    .weekplan-header h1 {
      font-size: 24px;
      margin: 0;
      color: #333;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }

    th, td {
      border: 1px solid #333;
      padding: 8px;
      text-align: left;
      vertical-align: top;
    }

    thead th {
      background-color: #f0f0f0;
      font-weight: bold;
      text-align: center;
      font-size: 14px;
      padding: 8px 4px;
      vertical-align: middle;
      border: 1px solid #333 !important;
    }

    .day-header {
      width: calc(100% / 7);
    }

    .day-name {
      font-size: 14px;
      font-weight: bold;
      line-height: 1.3;
      color: #000 !important;
    }

    .day-date {
      font-size: 11px;
      font-weight: normal;
      color: #666 !important;
      margin-top: 4px;
      line-height: 1.2;
    }

    .meal-cell {
      height: 80px;
      font-size: 12px;
      line-height: 1.4;
      padding: 8px;
    }

    .meal-cell ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .meal-cell li {
      padding: 2px 0;
    }

    .page-break {
      page-break-after: always;
      break-after: page;
    }

    @media print {
      @page {
        size: A4 landscape;
        margin: 10mm;
      }

      .print-hint {
        display: none !important;
      }

      body {
        padding: 0;
        margin: 0;
      }

      .weekplan-print {
        max-width: 100%;
      }

      table {
        page-break-inside: avoid;
      }

      th, td {
        page-break-inside: avoid;
      }

      .page-break {
        page-break-after: always;
        break-after: page;
      }
    }
  `;
}
