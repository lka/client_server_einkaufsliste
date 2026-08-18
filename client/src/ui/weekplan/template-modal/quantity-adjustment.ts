/**
 * Quantity adjustment logic for template modal
 */

import type { Template } from '../../../data/api/types.js';
import { adjustQuantityByFactor } from '../ingredient-parser.js';
import { createQuantityAdjustmentSection } from '../modal-shared.js';
import { renderTemplateItems } from './rendering.js';

/**
 * Setup and return quantity adjustment section
 */
export function setupQuantityAdjustment(
  template: Template,
  originalPersonCount: number,
  adjustedPersonCount: number | null,
  adjustedQuantities: Map<string, string>,
  removedItems: Set<string>,
  scrollableSection: HTMLElement,
  getSelectedItemName: () => string | null,
  onSelect: (name: string, menge: string) => void
): {
  adjustSection: HTMLElement;
  getAdjustedPersonCount: () => number | null;
  rerenderList: () => void;
} {
  let currentAdjustedPersonCount = adjustedPersonCount;

  const rerenderList = () => {
    const oldList = scrollableSection.querySelector('ul');
    if (oldList) {
      const newList = renderTemplateItems(
        template,
        removedItems,
        adjustedQuantities,
        getSelectedItemName(),
        onSelect
      );
      scrollableSection.replaceChild(newList, oldList);
    }
  };

  const adjustSection = createQuantityAdjustmentSection(
    originalPersonCount,
    adjustedPersonCount,
    (newPersonCount) => {
      currentAdjustedPersonCount = newPersonCount;

      // Calculate the factor based on person count
      const factor = newPersonCount / originalPersonCount;

      // Apply adjustment to all items with quantities
      template.items.forEach(item => {
        if (item.menge) {
          const adjusted = adjustQuantityByFactor(item.menge, factor);
          adjustedQuantities.set(item.name, adjusted);
        }
      });

      rerenderList();
    }
  );

  return {
    adjustSection,
    getAdjustedPersonCount: () => currentAdjustedPersonCount,
    rerenderList
  };
}

/**
 * Apply initial quantity adjustments if person count is set
 */
export function applyInitialAdjustments(
  template: Template,
  originalPersonCount: number,
  adjustedPersonCount: number | null,
  adjustedQuantities: Map<string, string>
): void {
  if (adjustedPersonCount !== null) {
    const factor = adjustedPersonCount / originalPersonCount;
    template.items.forEach(item => {
      if (item.menge) {
        const adjusted = adjustQuantityByFactor(item.menge, factor);
        adjustedQuantities.set(item.name, adjusted);
      }
    });
  }
}
