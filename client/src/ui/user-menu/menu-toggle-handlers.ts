/**
 * Menu toggle event handlers.
 */

/**
 * Close all submenus.
 */
function closeAllSubmenus(): void {
  const settingsSubmenu = document.getElementById('settingsSubmenu');
  const settingsMenuBtn = document.getElementById('settingsMenuBtn');
  const websocketSubmenu = document.getElementById('websocketSubmenu');
  const websocketMenuBtn = document.getElementById('websocketMenuBtn');

  if (settingsSubmenu) {
    settingsSubmenu.classList.remove('show');
  }
  if (settingsMenuBtn) {
    settingsMenuBtn.classList.remove('expanded');
  }
  if (websocketSubmenu) {
    websocketSubmenu.classList.remove('show');
  }
  if (websocketMenuBtn) {
    websocketMenuBtn.classList.remove('expanded');
  }
}

/**
 * Attach menu toggle handlers.
 */
export function attachMenuToggleHandlers(menuBtn: HTMLElement, menuDropdown: HTMLElement): void {
  // Menu toggle handler
  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    menuDropdown.classList.toggle('show');
  });

  // Close menu when clicking outside
  document.addEventListener('click', () => {
    menuDropdown.classList.remove('show');
    closeAllSubmenus();
  });

  // Prevent menu from closing when clicking inside dropdown
  menuDropdown.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Settings submenu toggle handler
  const settingsMenuBtn = document.getElementById('settingsMenuBtn');
  const settingsSubmenu = document.getElementById('settingsSubmenu');
  if (settingsMenuBtn && settingsSubmenu) {
    settingsMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      settingsSubmenu.classList.toggle('show');
      settingsMenuBtn.classList.toggle('expanded');
    });
  }

  // WebSocket submenu toggle handler
  const websocketMenuBtn = document.getElementById('websocketMenuBtn');
  const websocketSubmenu = document.getElementById('websocketSubmenu');
  if (websocketMenuBtn && websocketSubmenu) {
    websocketMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      websocketSubmenu.classList.toggle('show');
      websocketMenuBtn.classList.toggle('expanded');
    });
  }
}
