/**
 * Event handlers for weekplan UI interactions
 */

import { showTemplateDetails, showRecipeDetailsById } from '../weekplan/index.js';

/**
 * Setup event listener for showing meal item details
 */
export function setupDetailsEventListener(): void {
  // Handle clicks on meal items to show details
  document.addEventListener('weekplan:show-details', async (event: Event) => {
    const customEvent = event as CustomEvent;
    const { text, entryId, recipeId, templateId, entryType } = customEvent.detail;

    // Use entry_type to determine how to handle the click
    if (entryType === 'recipe' && recipeId) {
      // Show recipe details
      await showRecipeDetailsById(recipeId, entryId);
    } else if (entryType === 'template' && templateId) {
      // Show template details by ID
      try {
        await showTemplateDetails(text, entryId);
      } catch (error) {
        console.log('Template not found:', text);
      }
    } else if (entryType === 'text') {
      // Plain text entry - do nothing
      console.log('Text entry clicked:', text);
    } else {
      // Fallback for entries without entry_type (backward compatibility)
      if (recipeId) {
        await showRecipeDetailsById(recipeId, entryId);
      } else {
        try {
          await showTemplateDetails(text, entryId);
        } catch (error) {
          console.log('Not a template:', text);
        }
      }
    }
  });
}
