/**
 * Department CRUD operations.
 */

import type { Department } from '../../data/api.js';
import type { StoreState } from './types.js';
import { createDepartment, updateDepartment, deleteDepartment, fetchStoreProducts } from '../../data/api.js';

/**
 * Create a new department and add it to state.
 */
export async function addDepartment(
  state: StoreState,
  setState: (updates: Partial<StoreState>) => void,
  storeId: number,
  name: string,
  sortOrder: number = 0
): Promise<Department | null> {
  setState({ isLoading: true, error: null });

  try {
    const newDepartment = await createDepartment(storeId, name, sortOrder);
    if (newDepartment) {
      if (state.selectedStore?.id === storeId) {
        setState({
          departments: [...state.departments, newDepartment],
          isLoading: false,
          error: null,
        });
      } else {
        setState({ isLoading: false, error: null });
      }
      return newDepartment;
    }
    setState({ isLoading: false, error: 'Failed to create department' });
    return null;
  } catch (error) {
    console.error('Error creating department:', error);
    setState({
      isLoading: false,
      error: 'Failed to create department',
    });
    return null;
  }
}

/**
 * Update an existing department in state.
 */
export async function modifyDepartment(
  state: StoreState,
  setState: (updates: Partial<StoreState>) => void,
  departmentId: number,
  name?: string,
  sortOrder?: number
): Promise<Department | null> {
  setState({ isLoading: true, error: null });

  try {
    const updatedDepartment = await updateDepartment(departmentId, name, sortOrder);
    if (updatedDepartment) {
      const updatedDepartments = state.departments.map((d) =>
        d.id === departmentId ? updatedDepartment : d
      );

      const updatedSelectedDepartment =
        state.selectedDepartment?.id === departmentId
          ? updatedDepartment
          : state.selectedDepartment;

      setState({
        departments: updatedDepartments,
        selectedDepartment: updatedSelectedDepartment,
        isLoading: false,
        error: null,
      });
      return updatedDepartment;
    }
    setState({ isLoading: false, error: 'Failed to update department' });
    return null;
  } catch (error) {
    console.error('Error updating department:', error);
    setState({
      isLoading: false,
      error: 'Failed to update department',
    });
    return null;
  }
}

/**
 * Delete a department from state.
 */
export async function removeDepartment(
  state: StoreState,
  setState: (updates: Partial<StoreState>) => void,
  departmentId: number
): Promise<boolean> {
  setState({ isLoading: true, error: null });

  try {
    const success = await deleteDepartment(departmentId);
    if (success) {
      const filteredDepartments = state.departments.filter(
        (d) => d.id !== departmentId
      );

      const shouldClearDepartmentSelection =
        state.selectedDepartment?.id === departmentId;

      let updatedProducts = state.products;
      if (shouldClearDepartmentSelection && state.selectedStore) {
        try {
          updatedProducts = await fetchStoreProducts(state.selectedStore.id);
        } catch (error) {
          console.error('Error reloading products after department deletion:', error);
        }
      }

      setState({
        departments: filteredDepartments,
        selectedDepartment: shouldClearDepartmentSelection
          ? null
          : state.selectedDepartment,
        products: updatedProducts,
        isLoading: false,
        error: null,
      });
      return true;
    }
    setState({ isLoading: false, error: 'Failed to delete department' });
    return false;
  } catch (error) {
    console.error('Error deleting department:', error);
    setState({
      isLoading: false,
      error: 'Failed to delete department',
    });
    return false;
  }
}
