/**
 * Print utility functions for shopping lists
 * Handles print preview and formatting for different devices
 */


import { 
  isAndroid,
  printPreviewContentInline,
  printPreviewContentPopup } from './index.js';


/**
 * Main print preview function that delegates to the appropriate implementation
 */
export function printPreviewContent(
  frontContent: string,
  storeName: string,
  hideDepartments: boolean = false,
  selectedDate: string | null = null
): void {
  // Android devices have issues with popup windows for printing
  // Use inline printing approach for Android
  if (isAndroid()) {
    printPreviewContentInline(frontContent, storeName, hideDepartments, selectedDate);
    return;
  }

  // Standard popup approach for non-Android devices
  printPreviewContentPopup(frontContent, storeName, hideDepartments, selectedDate);
}
