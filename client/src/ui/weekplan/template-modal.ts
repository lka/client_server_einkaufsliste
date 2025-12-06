/**
 * Template details modal for weekplan
 * Handles template display, delta management, and item modifications
 */

import { Modal } from '../components/modal.js';
import { fetchTemplates, updateWeekplanEntryDeltas } from '../../data/api.js';
import type { WeekplanEntry, WeekplanDeltas, DeltaItem } from './types.js';
import { weekplanState } from './weekplan-state.js';
import { adjustQuantityByFactor } from './ingredient-parser.js';
import {
  createQuantityAdjustmentSection,
  createAddItemForm,
  createAddedItemsList,
  createScrollableSection,
  createFixedFormSection
} from './modal-shared.js';

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

    const renderTemplateItems = () => {
      const itemsList = document.createElement('ul');
      itemsList.style.cssText = 'list-style: none; padding: 0; margin: 0;';

      template.items.forEach(item => {
        const li = document.createElement('li');
        const isRemoved = removedItems.has(item.name);

        li.style.cssText = `
          padding: 0.25rem 0.5rem;
          background: ${isRemoved ? '#ffe6e6' : '#f8f9fa'};
          border-radius: 3px;
          margin-bottom: 0.25rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.9rem;
          transition: background-color 0.2s;
        `;

        // Left side: checkbox + name
        const leftDiv = document.createElement('div');
        leftDiv.style.cssText = 'display: flex; align-items: center; gap: 0.5rem;';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = isRemoved;
        checkbox.style.cssText = 'cursor: pointer; width: 16px; height: 16px;';
        checkbox.addEventListener('change', () => {
          if (checkbox.checked) {
            removedItems.add(item.name);
            li.style.backgroundColor = '#ffe6e6';
            nameSpan.style.textDecoration = 'line-through';
            nameSpan.style.opacity = '0.6';
          } else {
            removedItems.delete(item.name);
            li.style.backgroundColor = '#f8f9fa';
            nameSpan.style.textDecoration = 'none';
            nameSpan.style.opacity = '1';
          }
        });

        const nameSpan = document.createElement('span');
        nameSpan.textContent = item.name;
        nameSpan.style.cssText = `
          font-weight: 500;
          ${isRemoved ? 'text-decoration: line-through; opacity: 0.6;' : ''}
        `;

        leftDiv.appendChild(checkbox);
        leftDiv.appendChild(nameSpan);
        li.appendChild(leftDiv);

        if (item.menge) {
          const mengeSpan = document.createElement('span');
          // Use adjusted quantity if available, otherwise use original
          const displayMenge = adjustedQuantities.get(item.name) || item.menge;
          mengeSpan.textContent = displayMenge;
          mengeSpan.style.cssText = 'color: #666; font-size: 0.85rem; margin-left: 0.5rem;';
          li.appendChild(mengeSpan);
        }

        itemsList.appendChild(li);
      });

      return itemsList;
    };

    // Use template's person_count as the original value
    const originalPersonCount = template.person_count;
    let adjustedPersonCount: number | null = currentDeltas.person_count || null;

    // If person_count is set in deltas, apply the adjustment automatically
    if (adjustedPersonCount !== null) {
      const factor = adjustedPersonCount / originalPersonCount;
      template.items.forEach(item => {
        if (item.menge) {
          const adjusted = adjustQuantityByFactor(item.menge, factor);
          adjustedQuantities.set(item.name, adjusted);
        }
      });
    }

    if (template.items.length === 0) {
      const emptyMsg = document.createElement('p');
      emptyMsg.textContent = 'Keine Items in dieser Vorlage.';
      emptyMsg.style.cssText = 'color: #999;';
      scrollableSection.appendChild(emptyMsg);
    } else {
      // Quantity adjustment section
      const adjustSection = createQuantityAdjustmentSection(
        originalPersonCount,
        adjustedPersonCount,
        (newPersonCount) => {
          adjustedPersonCount = newPersonCount;

          // Calculate the factor based on person count
          const factor = newPersonCount / originalPersonCount;

          // Apply adjustment to all items with quantities
          template.items.forEach(item => {
            if (item.menge) {
              const adjusted = adjustQuantityByFactor(item.menge, factor);
              adjustedQuantities.set(item.name, adjusted);
            }
          });

          // Re-render the list
          const oldList = scrollableSection.querySelector('ul');
          if (oldList) {
            const newList = renderTemplateItems();
            scrollableSection.replaceChild(newList, oldList);
          }
        }
      );

      scrollableSection.appendChild(adjustSection);
      scrollableSection.appendChild(renderTemplateItems());
    }

    // Track added items
    const addedItems = new Map<string, DeltaItem>(
      currentDeltas.added_items.map(item => [item.name, item])
    );

    // Container for added items list (in scrollable section)
    const addedItemsContainer = document.createElement('div');
    addedItemsContainer.style.cssText = 'margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e0e0e0;';

    const renderAddedItems = () => {
      const newList = createAddedItemsList(addedItems, (name) => {
        addedItems.delete(name);
        renderAddedItems();
      });
      addedItemsContainer.innerHTML = '';
      addedItemsContainer.appendChild(newList);
    };

    renderAddedItems();
    scrollableSection.appendChild(addedItemsContainer);

    contentDiv.appendChild(scrollableSection);

    // Fixed section for adding new items (always visible at bottom)
    const addItemSection = createFixedFormSection();

    // Get existing item names for validation
    const existingItemNames = template.items.map(item => item.name);

    const addForm = createAddItemForm(
      (name, menge) => {
        addedItems.set(name, { name, menge });
        renderAddedItems();
      },
      existingItemNames
    );

    addItemSection.appendChild(addForm);

    // Add save button to the fixed section
    const saveButtonDiv = document.createElement('div');
    saveButtonDiv.style.cssText = 'margin-top: 0.75rem; display: flex; justify-content: flex-end;';

    const saveButton = document.createElement('button');
    saveButton.textContent = 'Änderungen speichern';
    saveButton.style.cssText = `
      background: #4a90e2;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: background-color 0.2s;
    `;
    saveButton.addEventListener('mouseover', () => {
      saveButton.style.backgroundColor = '#357abd';
    });
    saveButton.addEventListener('mouseout', () => {
      saveButton.style.backgroundColor = '#4a90e2';
    });

    // Collect checkbox states from DOM
    const collectCheckboxStates = () => {
      removedItems.clear();
      const checkboxes = contentDiv.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach((cb, index) => {
        const checkbox = cb as HTMLInputElement;
        if (checkbox.checked && template.items[index]) {
          removedItems.add(template.items[index].name);
        }
      });
    };

    saveButton.addEventListener('click', async () => {
      try {
        saveButton.disabled = true;
        saveButton.textContent = 'Speichere...';

        collectCheckboxStates();

        const newDeltas: WeekplanDeltas = {
          removed_items: Array.from(removedItems),
          added_items: Array.from(addedItems.values()),
          person_count: adjustedPersonCount !== null ? adjustedPersonCount : undefined
        };

        await updateWeekplanEntryDeltas(entryId, newDeltas);

        // Update local store
        if (currentEntry) {
          currentEntry.deltas = newDeltas;
        }

        saveButton.textContent = '✓ Gespeichert';
        saveButton.style.backgroundColor = '#5cb85c';

        setTimeout(() => {
          modal.close();
        }, 500);
      } catch (error) {
        console.error('Failed to save deltas:', error);
        saveButton.disabled = false;
        saveButton.textContent = 'Fehler - Nochmal versuchen';
        saveButton.style.backgroundColor = '#d9534f';
        setTimeout(() => {
          saveButton.textContent = 'Änderungen speichern';
          saveButton.style.backgroundColor = '#4a90e2';
        }, 2000);
      }
    });

    saveButtonDiv.appendChild(saveButton);
    addItemSection.appendChild(saveButtonDiv);

    contentDiv.appendChild(addItemSection);

    // Create and show modal
    const modal = new Modal({
      title: `📋 ${template.name}`,
      content: contentDiv,
      size: 'medium'
    });

    modal.open();
  } catch (error) {
    console.error('Failed to load template details:', error);
    throw error;
  }
}

/**
 * Find an entry by ID in the weekplan state
 */
function findEntryById(entryId: number): WeekplanEntry | undefined {
  const allEntries = weekplanState.getAllEntries();
  for (const dateMap of allEntries.values()) {
    for (const entries of dateMap.values()) {
      const entry = entries.find(e => e.id === entryId);
      if (entry) return entry;
    }
  }
  return undefined;
}
