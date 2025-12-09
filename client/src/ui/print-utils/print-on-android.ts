// Debug mode flag - set to true to enable debug console and logging
const DEBUG = false;

import { convertToFourColumns } from './convert-to-four-columns.js';

/**
 * Print preview content using browser print dialog (inline for Android)
 */
export function printPreviewContentInline(
  frontContent: string,
  storeName: string,
  hideDepartments: boolean = false,
  selectedDate: string | null = null
): void {
  // Save original content for restoration
  const originalContent = document.body.innerHTML;
  const originalTitle = document.title;

  // Replace dropdowns with static text in the content
  let processedFrontContent = frontContent || '<p>Keine Artikel für die Vorderseite</p>';

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
  } else {
    // If no date selected, show "Alle Daten"
    processedFrontContent = processedFrontContent.replace(
      /<select[^>]*>[\s\S]*?<\/select>/,
      '<span style="color: #666; font-size: 0.8rem;">Alle Daten</span>'
    );
  }

  // Convert CSS columns to actual side-by-side divs for Android compatibility
  if (processedFrontContent.includes('multi-column-print-content')) {
    // 4-column layout needs special conversion for Android
    processedFrontContent = convertToFourColumns(processedFrontContent);
  }

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

      /* Single page content (4-column layout) */
      .single-page-content {
        width: 100%;
      }

      /* 4-column layout for shopping lists (CSS columns - fallback) */
      .multi-column-print-content {
        column-count: 4;
        column-gap: 1cm;
        column-fill: auto;
      }

      /* 4-column manual layout (for Android) */
      .four-column-manual-layout {
        width: 100%;
      }

      .four-column-manual-layout .manual-column {
        flex: 1;
        min-width: 0;
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

  // Use single-page-content for 4-column layout
  document.body.innerHTML = `
    ${printStyles}
    <div class="single-page-content">
      ${processedFrontContent}
    </div>
  `;

  // Load debug features only if DEBUG mode is enabled
  if (DEBUG) {
    // Dynamically import debug module
    import ('./print-debug.js').then((debugModule) => {
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
