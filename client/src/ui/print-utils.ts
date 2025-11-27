/**
 * Print utility functions for shopping lists
 * Handles print preview and formatting for different devices
 */

import { showError } from './components/toast.js';

// Debug mode flag - set to true to enable debug console and logging
const DEBUG = false;

/**
 * Check if the current device is Android
 * This function detects Android even when "Desktop mode" is enabled in Chrome
 */
export function isAndroid(): boolean {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

  // Check for Android in userAgent (works when desktop mode is OFF)
  if (/android/i.test(userAgent)) {
    return true;
  }

  // Check platform API (modern approach)
  if ((navigator as any).userAgentData) {
    const platform = (navigator as any).userAgentData.platform || '';
    if (/android/i.test(platform)) {
      return true;
    }
  }

  // Check traditional platform property
  if (navigator.platform && /android/i.test(navigator.platform)) {
    return true;
  }

  // Additional heuristic: Check for touch support combined with screen characteristics
  // This helps detect Android tablets even in "Desktop mode"
  const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isLikelyMobile = /Mobile|Tablet/i.test(userAgent) || window.matchMedia('(pointer: coarse)').matches;

  // If we have touch support and mobile-like characteristics, but not iOS, it's likely Android
  if (hasTouchScreen && isLikelyMobile) {
    // Make sure it's not iOS (iPad, iPhone)
    const isIOS = /iPad|iPhone|iPod/i.test(userAgent) ||
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (!isIOS) {
      return true;
    }
  }

  return false;
}

/**
 * Print preview content using browser print dialog (inline for Android)
 */
export function printPreviewContentInline(
  frontContent: string,
  backContent: string,
  storeName: string,
  hideDepartments: boolean = false,
  selectedDate: string | null = null
): void {
  // Save original content for restoration
  const originalContent = document.body.innerHTML;
  const originalTitle = document.title;

  // Replace dropdowns with static text in the content
  let processedFrontContent = frontContent || '<p>Keine Artikel für die Vorderseite</p>';
  let processedBackContent = backContent || '<p>Keine Artikel für die Rückseite</p>';

  // First, replace store dropdown with static store name
  processedFrontContent = processedFrontContent.replace(
    /<select[^>]*>[\s\S]*?<\/select>/,
    `<span style="font-size: 1.2rem; font-weight: bold;">${storeName}</span>`
  );

  // Then, replace date dropdown with static date
  if (selectedDate) {
    // Format date for display
    const dateObj = new Date(selectedDate + 'T00:00:00');
    const formattedDate = dateObj.toLocaleDateString('de-DE');

    processedFrontContent = processedFrontContent.replace(
      /<select[^>]*>[\s\S]*?<\/select>/,
      `<span style="color: #666; font-size: 0.8rem;">${formattedDate}</span>`
    );

    processedBackContent = processedBackContent.replace(
      /<span[^>]*>(\d{2}\.\d{2}\.\d{4}|Alle Daten)<\/span>/,
      `<span style="color: #666; font-size: 0.8rem;">${formattedDate}</span>`
    );
  } else {
    // If no date selected, show "Alle Daten"
    processedFrontContent = processedFrontContent.replace(
      /<select[^>]*>[\s\S]*?<\/select>/,
      '<span style="color: #666; font-size: 0.8rem;">Alle Daten</span>'
    );
  }

  // Convert CSS columns to actual side-by-side divs for Android compatibility
  // This is the same approach used for iOS/Safari
  processedFrontContent = convertColumnsToSideBySide(processedFrontContent);
  processedBackContent = convertColumnsToSideBySide(processedBackContent);

  // Create print styles - optimized for Android with side-by-side layout like iPad
  const printStyles = `
    <style>
      /* Android print styles - side-by-side layout (Items left, Notes right) */

      * {
        box-sizing: border-box;
      }

      body {
        font-family: Arial, sans-serif;
        line-height: 1.4;
        color: #000;
        margin: 20px;
        padding: 0;
        background: white;
      }

      /* Container holds two sections side by side: Items (left) and Notes (right) */
      .print-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10mm;
        width: 100%;
      }

      .a5-page {
        padding: 5mm;
      }

      .a5-page.front {
        border-right: 1px dashed #ccc;
        padding-right: 10mm;
      }

      h2 {
        margin: 0 0 10px 0;
        font-size: 18px;
        font-weight: bold;
        color: #000;
      }

      p {
        margin: 0 0 8px 0;
        font-size: 14px;
      }

      h4.department-title {
        margin: 15px 0 5px 0;
        color: #000;
        font-size: 16px;
        font-weight: bold;
      }

      ul {
        margin: 0 0 10px 0;
        padding-left: 20px;
        list-style: disc;
      }

      li {
        margin-bottom: 4px;
        line-height: 1.4;
        font-size: 14px;
      }

      /* 2-column layout container - columns are created as actual divs by convertColumnsToSideBySide() */
      .two-column-layout {
        display: block;
        width: 100%;
        font-size: 0;
      }

      .two-column-layout > div {
        display: inline-block;
        vertical-align: top;
        font-size: 14px;
        box-sizing: border-box;
      }

      .two-column-layout > div:first-child {
        width: 47%;
        padding-right: 1rem;
      }

      .two-column-layout > div:last-child {
        width: 47%;
        padding-left: 1rem;
      }

      .department-section {
        margin-bottom: 10px;
      }

      body.hide-departments h4.department-title {
        display: none;
      }

      .notes-area {
        margin-top: 20px;
      }

      .notes-area h3 {
        margin-top: 0;
        font-size: 16px;
      }

      .note-lines {
        display: block;
      }

      .note-line {
        border-bottom: 1px solid #ccc;
        height: 20px;
        margin-bottom: 10px;
      }

      @media print {
        #debugConsole,
        #restoreContentBtn,
        #toggleDebugBtn {
          display: none !important;
        }

        body {
          margin: 0;
          padding: 10px;
        }

        /* Keep both sections on one page */
        .print-container {
          page-break-inside: avoid;
        }

        .a5-page {
          page-break-inside: auto;
        }

        .a5-page.front {
          border-right: 1px dashed #ccc;
        }
      }
    </style>
  `;

  // Replace body content with print content
  document.title = storeName;

  // Apply body class for hiding departments if needed
  if (hideDepartments) {
    document.body.className = 'hide-departments';
  } else {
    document.body.className = '';
  }

  document.body.innerHTML = `
    ${printStyles}
    <div class="print-container">
      <div class="a5-page front">
        ${processedFrontContent}
      </div>
      <div class="a5-page back">
        ${processedBackContent}
      </div>
    </div>
  `;

  // Load debug features only if DEBUG mode is enabled
  if (DEBUG) {
    // Dynamically import debug module
    import('./print-debug.js').then((debugModule) => {
      const { debugLog } = debugModule.addDebugConsole();
      debugModule.setupDebugHandlers(originalContent, originalTitle, debugLog);

      // Initial debug output
      debugLog('WICHTIG: Drücken Sie "Zurück zur Liste" nach dem Drucken', 'warn');
      debugLog('Print-Ansicht wird vorbereitet...', 'log');
      debugLog(`Content-Länge: ${document.body.innerHTML.length} Zeichen`, 'log');
      debugLog(`Anzahl Items: ${document.querySelectorAll('li').length}`, 'log');

      // Trigger print with debug logging
      setTimeout(() => {
        debugLog('Starte Druckvorgang...', 'log');
        debugLog(`Final Content-Länge: ${document.body.innerHTML.length}`, 'log');
        debugLog(`Final Anzahl Items: ${document.querySelectorAll('li').length}`, 'log');

        // Force a reflow before printing
        document.body.offsetHeight;
        debugLog('Reflow erzwungen', 'log');

        debugLog('Rufe window.print() auf...', 'warn');
        try {
          window.print();
          debugLog('window.print() erfolgreich aufgerufen', 'log');
        } catch (error) {
          const errorMsg = 'Fehler beim Aufruf von window.print(): ' + (error as Error).message;
          debugLog(errorMsg, 'error');
          alert('Druckfehler: ' + (error as Error).message);
        }
      }, 300);
    });
  } else {
    // Production mode: just trigger print without debug features
    setTimeout(() => {
      window.print();
    }, 300);
  }
}

/**
 * Convert CSS column layout to actual side-by-side divs for Safari/iOS compatibility
 * Safari ignores CSS column-count during printing, so we need to manually split the content
 */
function convertColumnsToSideBySide(htmlContent: string): string {
  // Create a temporary DOM to parse the HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;

  // Find all two-column-layout containers
  const twoColumnLayouts = tempDiv.querySelectorAll('.two-column-layout');

  twoColumnLayouts.forEach((layout) => {
    // Remove CSS column properties from the layout element to prevent double-columning
    if (layout instanceof HTMLElement) {
      layout.style.columnCount = '';
      layout.style.columnGap = '';
      layout.style.columns = '';
    }

    // Get ALL direct children (including store headers and department sections)
    const allChildren = Array.from(layout.children);

    if (allChildren.length === 0) return;

    // Split children at midpoint
    const midpoint = Math.ceil(allChildren.length / 2);
    const leftChildren = allChildren.slice(0, midpoint);
    const rightChildren = allChildren.slice(midpoint);

    // Create left column div (no inline styles - use CSS classes)
    const leftColumn = document.createElement('div');
    leftChildren.forEach((child) => {
      const clonedChild = child.cloneNode(true) as HTMLElement;
      leftColumn.appendChild(clonedChild);
    });

    // Create right column div (no inline styles - use CSS classes)
    const rightColumn = document.createElement('div');
    rightChildren.forEach((child) => {
      const clonedChild = child.cloneNode(true) as HTMLElement;
      rightColumn.appendChild(clonedChild);
    });

    // Clear the layout first, then append columns
    layout.innerHTML = '';
    layout.appendChild(leftColumn);
    layout.appendChild(rightColumn);
  });

  return tempDiv.innerHTML;
}

/**
 * Print preview content using browser print dialog (popup window for non-Android)
 */
export function printPreviewContentPopup(
  frontContent: string,
  backContent: string,
  storeName: string,
  hideDepartments: boolean = false,
  selectedDate: string | null = null
): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    showError('Popup-Blocker verhindert das Drucken. Bitte erlauben Sie Popups für diese Seite.');
    return;
  }

  // Replace dropdowns with static text in the content
  let processedFrontContent = frontContent || '<p>Keine Artikel für die Vorderseite</p>';
  let processedBackContent = backContent || '<p>Keine Artikel für die Rückseite</p>';

  // First, replace store dropdown with static store name
  processedFrontContent = processedFrontContent.replace(
    /<select[^>]*>[\s\S]*?<\/select>/,
    `<span style="font-size: 1.2rem; font-weight: bold;">${storeName}</span>`
  );

  // Then, replace date dropdown with static date
  if (selectedDate) {
    // Format date for display
    const dateObj = new Date(selectedDate + 'T00:00:00');
    const formattedDate = dateObj.toLocaleDateString('de-DE');

    processedFrontContent = processedFrontContent.replace(
      /<select[^>]*>[\s\S]*?<\/select>/,
      `<span style="color: #666; font-size: 0.8rem;">${formattedDate}</span>`
    );
    processedBackContent = processedBackContent.replace(
      /<span[^>]*>(\d{2}\.\d{2}\.\d{4}|Alle Daten)<\/span>/,
      `<span style="color: #666; font-size: 0.8rem;">${formattedDate}</span>`
    );
  } else {
    // If no date selected, show "Alle Daten"
    processedFrontContent = processedFrontContent.replace(
      /<select[^>]*>[\s\S]*?<\/select>/,
      '<span style="color: #666; font-size: 0.8rem;">Alle Daten</span>'
    );
  }

  // Convert CSS columns to actual side-by-side divs for Safari/iOS compatibility
  processedFrontContent = convertColumnsToSideBySide(processedFrontContent);
  processedBackContent = convertColumnsToSideBySide(processedBackContent);

  const hideDepartmentsClass = hideDepartments ? 'class="hide-departments"' : '';

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${storeName}</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          /* Optimized for tablet/desktop printing - side-by-side A5 pages */

          * {
            box-sizing: border-box;
          }

          body {
            font-family: Arial, sans-serif;
            line-height: 1.2;
            color: #333;
            margin: 0;
            padding: 10mm;
            background: white;
          }

          /* Container holds two A5 pages side by side */
          .print-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10mm;
            max-width: 100%;
          }

          .a5-page {
            padding: 5mm;
            min-height: 200mm;
          }

          .a5-page.front {
            border-right: 1px dashed #ccc;
            padding-right: 10mm;
          }

          h2 {
            margin: 0 0 0.5rem 0;
            font-size: 1.2rem;
            font-weight: bold;
          }

          p {
            margin: 0 0 0.5rem 0;
            font-size: 0.85rem;
          }

          h4.department-title {
            margin: 0.6rem 0 0.3rem 0;
            color: #333;
            font-size: 0.95rem;
            font-weight: bold;
          }

          ul {
            margin: 0 0 0.5rem 0;
            padding-left: 0;
            list-style: none;
          }

          li {
            margin-bottom: 0.15rem;
            line-height: 1.25;
            font-size: 0.85rem;
          }

          /* 2-column layout container - columns are created as actual divs by convertColumnsToSideBySide() */
          .two-column-layout {
            display: block;
            width: 100%;
            font-size: 0;
          }

          .two-column-layout > div {
            display: inline-block;
            vertical-align: top;
            font-size: 0.85rem;
            box-sizing: border-box;
          }

          .two-column-layout > div:first-child {
            width: 47%;
            padding-right: 1rem;
          }

          .two-column-layout > div:last-child {
            width: 47%;
            padding-left: 1rem;
          }

          /* Department sections */
          .department-section {
            margin-bottom: 0.4rem;
          }

          body.hide-departments h4.department-title {
            display: none;
          }

          .notes-area {
            margin-top: 1rem;
          }

          .notes-area h3 {
            margin-top: 0;
            font-size: 0.95rem;
          }

          .note-lines {
            display: flex;
            flex-direction: column;
            gap: 0.6rem;
          }

          .note-line {
            border-bottom: 1px solid #ddd;
            height: 0.8rem;
          }

          .print-hint {
            background: #fff3cd;
            padding: 10px;
            margin-bottom: 10px;
            border: 1px solid #ffc107;
            border-radius: 4px;
            text-align: center;
          }

          /* Print-specific styles */
          @media print {
            /* Hide the print hint when actually printing */
            .print-hint {
              display: none !important;
            }

            body {
              margin: 0;
              padding: 5mm;
            }

            .a5-page.front {
              border-right: none;
            }

            .print-container {
              gap: 5mm;
              width: 100%;
              max-width: none;
            }
          }

          /* For smaller screens/tablets, stack pages vertically */
          @media screen and (max-width: 800px) {
            .print-container {
              grid-template-columns: 1fr;
              gap: 20px;
            }

            .a5-page.front {
              border-right: none;
              border-bottom: 1px solid #ccc;
              padding-bottom: 20px;
            }
          }
        </style>
      </head>
      <body ${hideDepartmentsClass}>
        <div class="print-hint">
          <strong>📱 Druckhinweis:</strong> Bitte wählen Sie im Druckdialog <strong>Querformat (Landscape)</strong> für optimale Darstellung!
        </div>
        <div class="print-container">
          <div class="a5-page front">
            ${processedFrontContent}
          </div>
          <div class="a5-page back">
            ${processedBackContent}
          </div>
        </div>
      </body>
    </html>
  `);

  printWindow.document.close();

  // Wait for content to render, then trigger print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      // Close window after print dialog is closed (user prints or cancels)
      setTimeout(() => {
        printWindow.close();
      }, 100);
    }, 250);
  };
}

/**
 * Main print preview function that delegates to the appropriate implementation
 */
export function printPreviewContent(
  frontContent: string,
  backContent: string,
  storeName: string,
  hideDepartments: boolean = false,
  selectedDate: string | null = null
): void {
  // Android devices have issues with popup windows for printing
  // Use inline printing approach for Android
  if (isAndroid()) {
    printPreviewContentInline(frontContent, backContent, storeName, hideDepartments, selectedDate);
    return;
  }

  // Standard popup approach for non-Android devices
  printPreviewContentPopup(frontContent, backContent, storeName, hideDepartments, selectedDate);
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
  entries: Map<string, Map<string, Array<{ id: number; text: string }>>>
): void {
  // Calculate week days
  const dayNames = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

  // Get dates for this week (Monday to Sunday)
  const dates = Array.from(entries.keys()).sort();

  // Build table HTML
  let tableHTML = '<table>';

  // Header row with day names and dates
  tableHTML += '<thead><tr>';
  dayNames.forEach((day, dayIndex) => {
    const date = dates[dayIndex];
    let dateStr = '';
    if (date) {
      // Extract DD.MM. from ISO date (YYYY-MM-DD)
      const parts = date.split('-');
      dateStr = `${parts[2]}.${parts[1]}.`;
    }
    tableHTML += `<th class="day-header"><div class="day-name">${day}</div><div class="day-date">${dateStr}</div></th>`;
  });
  tableHTML += '</tr></thead><tbody>';

  // Row for each meal
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

  // Android: inline printing
  if (isAndroid()) {
    printWeekplanInline(weekNumber, year, tableHTML);
  } else {
    // Desktop/iOS: popup printing
    printWeekplanPopup(weekNumber, year, tableHTML);
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
    }
  `;
}
