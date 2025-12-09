import { showError } from '../components/toast.js';
import { convertToFourColumns } from './index.js';

/**
 * Print preview content using browser print dialog (popup window for non-Android)
 */
export function printPreviewContentPopup(
  frontContent: string,
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

  // Convert CSS columns to actual side-by-side divs for Safari/iOS compatibility
  if (processedFrontContent.includes('multi-column-print-content')) {
    // 4-column layout needs special conversion for Safari/iOS
    processedFrontContent = convertToFourColumns(processedFrontContent);
  }

  const hideDepartmentsClass = hideDepartments ? 'class="hide-departments"' : '';

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${storeName}</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          /* Optimized for tablet/desktop printing */

          @page {
            size: A4 landscape;
            margin: 1cm;
          }

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

          /* 4-column manual layout (for Safari/iOS) */
          .four-column-manual-layout {
            width: 100%;
          }

          .four-column-manual-layout .manual-column {
            flex: 1;
            min-width: 0;
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

          /* Department sections */
          .department-section {
            margin-bottom: 0.4rem;
          }

          body.hide-departments h4.department-title {
            display: none;
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
              padding: 5mm;
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

          }
        </style>
      </head>
      <body ${hideDepartmentsClass}>
        <div class="print-hint">
          <strong>📱 Druckhinweis:</strong> Bitte wählen Sie im Druckdialog <strong>Querformat (Landscape)</strong> für optimale Darstellung!
        </div>
        <div class="single-page-content">
          ${processedFrontContent}
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
