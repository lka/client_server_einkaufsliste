/**
 * Quantity adjustment section for templates/recipes.
 */

import { showError, createInput, createButton } from '../../components/index.js';

/**
 * Create a quantity adjustment section for templates/recipes
 */
export function createQuantityAdjustmentSection(
  originalPersonCount: number,
  currentPersonCount: number | null,
  onAdjust: (newPersonCount: number) => void
): HTMLDivElement {
  const adjustSection = document.createElement('div');
  adjustSection.style.cssText = 'margin-bottom: 0.75rem; padding: 0.5rem; background: #fff9e6; border-radius: 4px;';

  const adjustLabel = document.createElement('label');
  adjustLabel.textContent = `Mengen anpassen (Vorlage für ${originalPersonCount} Personen):`;
  adjustLabel.htmlFor = 'personCountAdjustInput';
  adjustLabel.style.cssText = 'display: block; font-size: 0.85rem; margin-bottom: 0.5rem; color: #666; font-weight: 500;';
  adjustSection.appendChild(adjustLabel);

  const adjustForm = document.createElement('div');
  adjustForm.style.cssText = 'display: flex; gap: 0.5rem; align-items: stretch;';

  // Create input using component library
  const adjustInputGroup = createInput({
    type: 'number',
    id: 'personCountAdjustInput',
    name: 'personCountAdjust',
    placeholder: 'Anzahl Personen',
    value: String(currentPersonCount !== null ? currentPersonCount : originalPersonCount),
    className: 'adjust-input-compact'
  });

  // Set input attributes for number constraints
  adjustInputGroup.input.min = '1';
  adjustInputGroup.input.step = '1';

  // Adjust styling for compact form layout - remove gap and margin, match button height
  adjustInputGroup.container.style.cssText = 'flex: 0 0 120px; margin-bottom: 0; gap: 0; align-items: stretch;';
  // Match input padding to button padding for perfect alignment
  adjustInputGroup.input.style.padding = '0.75rem 1rem';
  adjustInputGroup.input.style.height = 'auto';
  adjustInputGroup.input.style.boxSizing = 'border-box';

  // Create button using component library
  const adjustBtn = createButton({
    label: 'Anpassen',
    variant: 'secondary',
    size: 'medium',
    onClick: () => {
      const targetPersonCount = parseInt(adjustInputGroup.input.value.trim());
      if (!targetPersonCount || targetPersonCount < 1) {
        showError('Bitte gültige Personenanzahl eingeben (mindestens 1)');
        return;
      }
      onAdjust(targetPersonCount);
      adjustInputGroup.input.value = String(targetPersonCount);
    }
  });

  // Override button color to match original orange theme and ensure full height
  adjustBtn.style.backgroundColor = '#ff9800';
  adjustBtn.style.padding = '0.75rem 1rem';
  adjustBtn.style.height = 'auto';
  adjustBtn.style.boxSizing = 'border-box';
  adjustBtn.style.alignSelf = 'stretch';
  adjustBtn.addEventListener('mouseenter', () => {
    adjustBtn.style.backgroundColor = '#f57c00';
  });
  adjustBtn.addEventListener('mouseleave', () => {
    adjustBtn.style.backgroundColor = '#ff9800';
  });

  adjustForm.appendChild(adjustInputGroup.container);
  adjustForm.appendChild(adjustBtn);
  adjustSection.appendChild(adjustForm);

  return adjustSection;
}
