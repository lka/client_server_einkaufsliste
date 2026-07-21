/**
 * Shopping list item operations.
 * Handles adding items with template support.
 */

import { fetchTemplates, getConfig } from '../../data/api.js';
import { showError, showSuccess } from '../components/toast.js';
import { shoppingListState } from '../../state/shopping-list-state.js';
import { calculateNextShoppingDay, dateToISOString } from './filters.js';

export interface AddItemOptions {
  name: string;
  menge?: string;
  storeId?: number;
  shoppingDate?: string;
}

/**
 * Add an item or template to the shopping list
 */
export async function addItemOrTemplate(options: AddItemOptions): Promise<boolean> {
  const { name, menge, storeId, shoppingDate } = options;

  // Check if input matches a template name
  const templates = await fetchTemplates();
  const matchedTemplate = templates.find(
    (t) => t.name.toLowerCase() === name.toLowerCase()
  );

  if (matchedTemplate) {
    // Template found - insert all template items
    return await addTemplateItems(matchedTemplate, storeId, shoppingDate, templates);
  } else {
    // Normal item - add as usual
    const item = await shoppingListState.addItem(name, menge, storeId, shoppingDate);
    return item !== null;
  }
}

/**
 * Add all items from a template
 */
async function addTemplateItems(
  template: any,
  storeId: number | undefined,
  shoppingDate: string | undefined,
  allTemplates: any[]
): Promise<boolean> {
  if (!storeId) {
    showError('Bitte wählen Sie zuerst ein Geschäft aus, um eine Vorlage zu verwenden.');
    return false;
  }

  if (!shoppingDate) {
    showError('Bitte wählen Sie ein Datum aus, um eine Vorlage zu verwenden.');
    return false;
  }

  // Add all template items (but skip any that match template names to prevent recursion)
  let successCount = 0;
  let skippedCount = 0;
  const templateNames = allTemplates.map(t => t.name.toLowerCase());

  for (const templateItem of template.items) {
    // Skip items that match template names (recursion prevention)
    if (templateNames.includes(templateItem.name.toLowerCase())) {
      skippedCount++;
      continue;
    }

    const item = await shoppingListState.addItem(
      templateItem.name,
      templateItem.menge,
      storeId,
      shoppingDate
    );
    if (item) {
      successCount++;
    }
  }

  if (successCount > 0) {
    let message = `${successCount} Artikel aus Vorlage "${template.name}" hinzugefügt!`;
    if (skippedCount > 0) {
      message += ` (${skippedCount} Artikel übersprungen, um Rekursion zu vermeiden)`;
    }
    showSuccess(message);
    return true;
  } else if (skippedCount > 0) {
    showError(
      `Alle ${skippedCount} Artikel aus Vorlage "${template.name}" wurden übersprungen, ` +
      `da sie Template-Namen entsprechen (Rekursionsschutz).`
    );
    return false;
  }

  return false;
}

/**
 * Delete an item from the shopping list
 */
export async function deleteItem(itemId: string): Promise<boolean> {
  return await shoppingListState.deleteItem(itemId);
}

/**
 * Move an item between the main shopping day and the fresh products day.
 * Items currently on the fresh products day are moved to the main shopping
 * day; all other items (including those on unrelated dates) are moved to
 * the fresh products day.
 */
export async function moveItem(itemId: string): Promise<boolean> {
  const item = shoppingListState.getItems().find(i => i.id === itemId);
  if (!item) {
    console.error('Cannot move item: not found in state', itemId);
    return false;
  }

  const config = await getConfig();
  // Convert from Python convention (0=Monday) to JavaScript convention (0=Sunday)
  const mainShoppingDay = ((config?.main_shopping_day ?? 2) + 1) % 7;
  const freshProductsDay = ((config?.fresh_products_day ?? 4) + 1) % 7;

  const nextMainDate = dateToISOString(calculateNextShoppingDay(mainShoppingDay));
  const nextFreshDate = dateToISOString(calculateNextShoppingDay(freshProductsDay));

  const targetDate = item.shopping_date === nextFreshDate ? nextMainDate : nextFreshDate;

  return await shoppingListState.moveItem(itemId, targetDate);
}
