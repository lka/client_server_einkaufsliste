/**
 * Swap sort order of two units.
 */
import { fetchUnits, updateUnit } from '../../data/api.js';
import { showError, showSuccess } from '../components/toast.js';
import { renderUnits } from './units-admin-render.js';

/**
 * Load and render units from API.
 */
export async function loadUnits(): Promise<void> {
  try {
    const units = await fetchUnits();
    renderUnits(units);
  } catch (error) {
    showError('Fehler beim Laden der Einheiten');
    console.error('Error loading units:', error);
  }
}

export async function swapUnits(unitId1: number, unitId2: number): Promise<void> {
  try {
    const units = await fetchUnits();
    const unit1 = units.find(u => u.id === unitId1);
    const unit2 = units.find(u => u.id === unitId2);

    if (!unit1 || !unit2) return;

    await updateUnit(unit1.id, { sort_order: unit2.sort_order });
    await updateUnit(unit2.id, { sort_order: unit1.sort_order });

    await loadUnits();
    showSuccess('Reihenfolge aktualisiert');
  } catch (error) {
    showError('Fehler beim Ändern der Reihenfolge');
    console.error('Error swapping units:', error);
  }
}

/**
 * Move unit up or down in sort order.
 */
export async function moveUnit(unitId: number, direction: 'up' | 'down'): Promise<void> {
  try {
    const units = await fetchUnits();
    const currentIndex = units.findIndex(u => u.id === unitId);

    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= units.length) return;

    // Swap sort_order values
    const currentUnit = units[currentIndex];
    const targetUnit = units[targetIndex];

    await updateUnit(currentUnit.id, { sort_order: targetUnit.sort_order });
    await updateUnit(targetUnit.id, { sort_order: currentUnit.sort_order });

    await loadUnits();
    showSuccess('Reihenfolge aktualisiert');
  } catch (error) {
    showError('Fehler beim Ändern der Reihenfolge');
    console.error('Error moving unit:', error);
  }
}
