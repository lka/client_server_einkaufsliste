/**
 * Handles drag-and-drop functionality for reordering units in the admin interface.
 */
import { swapUnits } from './units-admin-actions.js';

// Drag and Drop state
let draggedElement: HTMLElement | null = null;

export function handleDragStart(e: DragEvent): void {
  draggedElement = e.currentTarget as HTMLElement;
  draggedElement.style.opacity = '0.5';
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', draggedElement.innerHTML);
  }
}

export function handleDragOver(e: DragEvent): void {
  if (e.preventDefault) {
    e.preventDefault();
  }
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move';
  }
}

export function handleDrop(e: DragEvent): void {
  if (e.stopPropagation) {
    e.stopPropagation();
  }
  e.preventDefault();

  const target = e.currentTarget as HTMLElement;

  if (draggedElement && draggedElement !== target) {
    const draggedId = parseInt(draggedElement.dataset.unitId || '0');
    const targetId = parseInt(target.dataset.unitId || '0');

    swapUnits(draggedId, targetId);
  }
}

export function handleDragEnd(): void {
  if (draggedElement) {
    draggedElement.style.opacity = '1';
  }
  draggedElement = null;
}
