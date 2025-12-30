/**
 * Swap sort order of two units.
 */
import { updateUnit } from '../../data/api.js';
import { unitsAdminState } from '../../state/units-admin-state.js';
import { showError, showSuccess } from '../components/toast.js';

/**
 * Load and render units from API.
 */
export async function loadUnits(): Promise<void> {
  try {
    await unitsAdminState.loadUnits();
  } catch (error) {
    showError('Fehler beim Laden der Einheiten');
    console.error('Error loading units:', error);
  }
}

/**
 * Insert a unit at a new position (drag & drop).
 * Shifts all units between old and new position.
 */
export async function insertUnitAt(draggedUnitId: number, targetUnitId: number): Promise<void> {
  try {
    const units = unitsAdminState.getUnits();
    const draggedIndex = units.findIndex(u => u.id === draggedUnitId);
    const targetIndex = units.findIndex(u => u.id === targetUnitId);

    if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) {
      return;
    }

    // Create a new array with the reordered units
    const reordered = [...units];
    const [draggedUnit] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, draggedUnit);

    // Update sort_order for all affected units
    const updates = [];
    for (let i = 0; i < reordered.length; i++) {
      if (reordered[i].sort_order !== i) {
        updates.push(updateUnit(reordered[i].id, { sort_order: i }));
      }
    }

    await Promise.all(updates);
    await unitsAdminState.loadUnits();
    showSuccess('Reihenfolge aktualisiert');
  } catch (error) {
    showError('Fehler beim Ändern der Reihenfolge');
    console.error('Error inserting unit:', error);
  }
}

/**
 * @deprecated Use insertUnitAt for drag & drop instead
 */
export async function swapUnits(unitId1: number, unitId2: number): Promise<void> {
  try {
    const units = unitsAdminState.getUnits();
    const unit1 = units.find(u => u.id === unitId1);
    const unit2 = units.find(u => u.id === unitId2);

    if (!unit1 || !unit2) return;

    await updateUnit(unit1.id, { sort_order: unit2.sort_order });
    await updateUnit(unit2.id, { sort_order: unit1.sort_order });

    await unitsAdminState.loadUnits();
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
    const units = unitsAdminState.getUnits();
    const currentIndex = units.findIndex(u => u.id === unitId);

    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= units.length) return;

    // Swap sort_order values
    const currentUnit = units[currentIndex];
    const targetUnit = units[targetIndex];

    await updateUnit(currentUnit.id, { sort_order: targetUnit.sort_order });
    await updateUnit(targetUnit.id, { sort_order: currentUnit.sort_order });

    await unitsAdminState.loadUnits();
    showSuccess('Reihenfolge aktualisiert');
  } catch (error) {
    showError('Fehler beim Ändern der Reihenfolge');
    console.error('Error moving unit:', error);
  }
}
