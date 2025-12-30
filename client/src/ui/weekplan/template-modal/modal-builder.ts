/**
 * Main modal builder for template details
 */

import { Modal } from '../../components/modal.js';
import { fetchTemplates } from '../../../data/api.js';
import type { WeekplanDeltas, DeltaItem } from '../types.js';
import { createScrollableSection, createFixedFormSection } from '../modal-shared.js';
import { findEntryById } from './utils.js';
import { renderTemplateItems } from './rendering.js';
import { setupQuantityAdjustment, applyInitialAdjustments } from './quantity-adjustment.js';
import { setupAddedItems } from './added-items.js';
import { createSaveButton } from './save-handler.js';

/**
 * Show template details in a modal with delta management
 */
export async function showTemplateDetails(templateName: string, entryId: number): Promise<void> {
  try {
    // Fetch all templates and find matching one
    const templates = await fetchTemplates();
    const template = templates.find(t => t.name.toLowerCase() === templateName.toLowerCase());

    if (!template) {
      // Not a template - caller should handle recipe lookup
      throw new Error('Template not found');
    }

    // Get current entry to load existing deltas
    const currentEntry = findEntryById(entryId);

    // Initialize deltas from current entry or create new
    const currentDeltas: WeekplanDeltas = currentEntry?.deltas || {
      removed_items: [],
      added_items: []
    };

    // Build content with scrollable template items section
    const contentDiv = document.createElement('div');
    contentDiv.style.cssText = 'display: flex; flex-direction: column; max-height: 500px;';

    // Scrollable section for template items
    const scrollableSection = createScrollableSection();

    if (template.description) {
      const description = document.createElement('p');
      description.textContent = template.description;
      description.style.cssText = 'color: #666; margin-bottom: 0.5rem; font-style: italic; font-size: 0.9rem;';
      scrollableSection.appendChild(description);
    }

    // Track which items are removed (checked = removed)
    const removedItems = new Set<string>(currentDeltas.removed_items);

    // Store adjusted quantities for template items
    const adjustedQuantities = new Map<string, string>();

    // Use template's person_count as the original value
    const originalPersonCount = template.person_count;
    let adjustedPersonCount: number | null = currentDeltas.person_count || null;

    // If person_count is set in deltas, apply the adjustment automatically
    applyInitialAdjustments(template, originalPersonCount, adjustedPersonCount, adjustedQuantities);

    if (template.items.length === 0) {
      const emptyMsg = document.createElement('p');
      emptyMsg.textContent = 'Keine Items in dieser Vorlage.';
      emptyMsg.style.cssText = 'color: #999;';
      scrollableSection.appendChild(emptyMsg);
    } else {
      // Quantity adjustment section
      const { adjustSection, getAdjustedPersonCount } = setupQuantityAdjustment(
        template,
        originalPersonCount,
        adjustedPersonCount,
        adjustedQuantities,
        removedItems,
        scrollableSection
      );

      scrollableSection.appendChild(adjustSection);
      scrollableSection.appendChild(renderTemplateItems(template, removedItems, adjustedQuantities));

      // Track added items
      const addedItems = new Map<string, DeltaItem>(
        currentDeltas.added_items.map(item => [item.name, item])
      );

      // Container for added items list (in scrollable section)
      const addedItemsContainer = document.createElement('div');
      addedItemsContainer.style.cssText = 'margin-top: 1rem;';

      const { renderAddedItems, addItemForm } = setupAddedItems(addedItems, addedItemsContainer);

      renderAddedItems();
      scrollableSection.appendChild(addedItemsContainer);

      contentDiv.appendChild(scrollableSection);

      // Fixed section for adding new items (always visible at bottom)
      const addItemSection = createFixedFormSection();
      addItemSection.appendChild(addItemForm);

      // Add save button to the fixed section
      const saveButtonDiv = createSaveButton(
        entryId,
        template,
        currentEntry,
        contentDiv,
        removedItems,
        addedItems,
        getAdjustedPersonCount,
        null as any // Will be set after modal creation
      );

      addItemSection.appendChild(saveButtonDiv);
      contentDiv.appendChild(addItemSection);

      // Create and show modal
      const modal = new Modal({
        title: `📋 ${template.name}`,
        content: contentDiv,
        size: 'medium'
      });

      // Update modal reference in save button
      const saveButtonDivWithModal = createSaveButton(
        entryId,
        template,
        currentEntry,
        contentDiv,
        removedItems,
        addedItems,
        getAdjustedPersonCount,
        modal
      );

      // Replace the placeholder save button
      addItemSection.replaceChild(saveButtonDivWithModal, saveButtonDiv);

      modal.open();
    }
  } catch (error) {
    console.error('Failed to load template details:', error);
    throw error;
  }
}
