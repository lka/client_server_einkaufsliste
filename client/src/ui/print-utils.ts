/**
 * Print utility functions for shopping lists
 * Handles print preview and formatting for different devices
 */

import { showError } from './components/toast.js';

/**
 * Check if the current device is Android
 */
export function isAndroid(): boolean {
  return /Android/i.test(navigator.userAgent);
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

  // Remove inline column styles from the HTML to force single column
  processedFrontContent = processedFrontContent.replace(/style="[^"]*column-count:[^"]*"/g, 'style=""');
  processedFrontContent = processedFrontContent.replace(/style="[^"]*columns:[^"]*"/g, 'style=""');
  processedBackContent = processedBackContent.replace(/style="[^"]*column-count:[^"]*"/g, 'style=""');
  processedBackContent = processedBackContent.replace(/style="[^"]*columns:[^"]*"/g, 'style=""');

  // Create print styles - ultra-simplified for Android compatibility
  const printStyles = `
    <style>
      /* Ultra-simplified print styles for Android compatibility - NO @page rules */

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

      .print-container {
        display: block;
        width: 100%;
      }

      .a5-page {
        display: block;
        width: 100%;
        margin-bottom: 30px;
        padding: 10px 0;
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

      /* Force single column layout for Android - no columns at all */
      .two-column-layout {
        display: block;
        width: 100%;
        column-count: 1 !important;
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

        .a5-page {
          page-break-after: always;
        }

        .a5-page.back {
          page-break-after: auto;
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

  // Add debug console and back button for Android
  const debugConsoleHtml = `
    <div id="debugConsole" style="
      position: fixed;
      bottom: 10px;
      left: 10px;
      right: 10px;
      max-height: 200px;
      overflow-y: auto;
      background: rgba(0, 0, 0, 0.9);
      color: #0f0;
      font-family: monospace;
      font-size: 11px;
      padding: 10px;
      border-radius: 6px;
      z-index: 10000;
      display: block;
    ">VERSION 2024-11-24 15:30</div>
    <div style="position: fixed; top: 10px; left: 10px; z-index: 9999;">
      <button id="restoreContentBtn" style="
        padding: 12px 24px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 16px;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        margin-right: 10px;
      ">← Zurück zur Liste</button>
      <button id="toggleDebugBtn" style="
        padding: 12px 24px;
        background: #28a745;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 16px;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      ">Debug Ein/Aus</button>
    </div>
  `;

  // Insert debug console and buttons at the beginning of body
  document.body.insertAdjacentHTML('afterbegin', debugConsoleHtml);

  // Create custom console logger
  const debugLog = (message: string, type: 'log' | 'error' | 'warn' = 'log') => {
    console.log(message);
    const debugConsole = document.getElementById('debugConsole');
    if (debugConsole) {
      const timestamp = new Date().toLocaleTimeString();
      const color = type === 'error' ? '#f00' : type === 'warn' ? '#ff0' : '#0f0';
      debugConsole.innerHTML += `<div style="color: ${color}; margin-bottom: 3px;">[${timestamp}] ${message}</div>`;
      debugConsole.scrollTop = debugConsole.scrollHeight;
    }
  };

  // Function to restore content
  const restoreContent = () => {
    debugLog('Restoring content...', 'log');
    document.title = originalTitle;
    document.body.innerHTML = originalContent;
    // Reload the page to restore all functionality
    window.location.reload();
  };

  // Add click handler for back button
  const backButton = document.getElementById('restoreContentBtn');
  if (backButton) {
    backButton.addEventListener('click', restoreContent);
  }

  // Add click handler for debug toggle button
  const toggleDebugBtn = document.getElementById('toggleDebugBtn');
  const debugConsole = document.getElementById('debugConsole');
  if (toggleDebugBtn && debugConsole) {
    toggleDebugBtn.addEventListener('click', () => {
      if (debugConsole.style.display === 'none') {
        debugConsole.style.display = 'block';
        debugLog('Debug-Konsole aktiviert', 'log');
      } else {
        debugConsole.style.display = 'none';
      }
    });
  }

  // DO NOT auto-restore on Android - it causes the print preview to fail
  // The content must stay until the user manually clicks the back button
  // Android's print engine needs the DOM to remain stable during preview generation

  debugLog('WICHTIG: Drücken Sie "Zurück zur Liste" nach dem Drucken', 'warn');

  // Initial debug output
  debugLog('Print-Ansicht wird vorbereitet...', 'log');
  debugLog(`Content-Länge: ${document.body.innerHTML.length} Zeichen`, 'log');
  debugLog(`Anzahl Items: ${document.querySelectorAll('li').length}`, 'log');

  // Trigger print after a delay to ensure:
  // 1. Content is fully rendered
  // 2. Styles are applied
  // 3. Android print engine has time to initialize
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
