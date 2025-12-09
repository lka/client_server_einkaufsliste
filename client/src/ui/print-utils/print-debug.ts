/**
 * Debug utilities for print functionality
 * Only loaded when DEBUG mode is enabled
 */

/**
 * Add debug console and controls to the page
 * @returns Object with debugLog function
 */
export function addDebugConsole() {
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
    ">VERSION 2024-11-26 12:00</div>
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

  return { debugLog };
}

/**
 * Setup debug console event handlers
 * @param originalContent - Original page content for restoration
 * @param originalTitle - Original page title for restoration
 * @param debugLog - Debug logging function
 */
export function setupDebugHandlers(
  originalContent: string,
  originalTitle: string,
  debugLog: (message: string, type?: 'log' | 'error' | 'warn') => void
) {
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
}