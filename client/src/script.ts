/**
 * Shopping list client application entry point.
 * Manages items via REST API with TypeScript type safety.
 */

import { fetchItems, addItem, deleteItem } from './api';
import { renderItems, loadAppTemplate } from './dom';

/**
 * Load and display all items.
 */
async function load(): Promise<void> {
  const list = await fetchItems();
  renderItems(list);
}

/**
 * Initialize event handlers for the application.
 */
function initializeEventHandlers(): void {
  const input = document.getElementById('itemInput') as HTMLInputElement;
  const addBtn = document.getElementById('addBtn') as HTMLButtonElement;

  if (!input || !addBtn) {
    console.error('Required elements not found');
    return;
  }

  addBtn.addEventListener('click', async () => {
    const val = input.value.trim();
    if (!val) {
      return;
    }

    const item = await addItem(val);
    if (item) {
      input.value = '';
      await load();
    }
  });

  input.addEventListener('keyup', (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      addBtn.click();
    }
  });

  // Event delegation for delete buttons
  const itemsList = document.getElementById('items');
  if (itemsList) {
    itemsList.addEventListener('click', async (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('removeBtn')) {
        const itemId = target.dataset.itemId;
        if (itemId) {
          const success = await deleteItem(itemId);
          if (success) {
            await load();
          }
        }
      }
    });
  }

  // Initial load
  load();
}

/**
 * Initialize the application when DOM is ready.
 */
window.addEventListener('DOMContentLoaded', async () => {
  // Load the app template first
  const templateLoaded = await loadAppTemplate();
  if (!templateLoaded) {
    console.error('Failed to initialize application');
    return;
  }

  // Initialize event handlers after template is loaded
  initializeEventHandlers();
});
