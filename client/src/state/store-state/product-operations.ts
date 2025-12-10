/**
 * Product CRUD operations.
 */

import type { Product } from '../../data/api.js';
import type { StoreState } from './types.js';
import { createProduct, updateProduct, deleteProduct } from '../../data/api.js';

/**
 * Create a new product and add it to state.
 */
export async function addProduct(
  state: StoreState,
  setState: (updates: Partial<StoreState>) => void,
  name: string,
  departmentId: number
): Promise<Product | null> {
  if (!state.selectedStore) {
    console.error('Cannot create product: no store selected');
    setState({ error: 'No store selected' });
    return null;
  }

  setState({ isLoading: true, error: null });

  try {
    const newProduct = await createProduct(name, state.selectedStore.id, departmentId);
    if (newProduct) {
      const shouldAddToList =
        !state.selectedDepartment ||
        state.selectedDepartment.id === departmentId;

      if (shouldAddToList) {
        setState({
          products: [...state.products, newProduct],
          isLoading: false,
          error: null,
        });
      } else {
        setState({ isLoading: false, error: null });
      }
      return newProduct;
    }
    setState({ isLoading: false, error: 'Failed to create product' });
    return null;
  } catch (error) {
    console.error('Error creating product:', error);
    setState({
      isLoading: false,
      error: 'Failed to create product',
    });
    return null;
  }
}

/**
 * Update an existing product in state.
 */
export async function modifyProduct(
  state: StoreState,
  setState: (updates: Partial<StoreState>) => void,
  productId: number,
  updates: { name?: string; department_id?: number }
): Promise<Product | null> {
  setState({ isLoading: true, error: null });

  try {
    const updatedProduct = await updateProduct(productId, updates);
    if (updatedProduct) {
      const departmentChanged =
        updates.department_id !== undefined &&
        state.selectedDepartment &&
        updates.department_id !== state.selectedDepartment.id;

      let updatedProducts;
      if (departmentChanged) {
        updatedProducts = state.products.filter((p) => p.id !== productId);
      } else {
        updatedProducts = state.products.map((p) =>
          p.id === productId ? updatedProduct : p
        );
      }

      setState({
        products: updatedProducts,
        isLoading: false,
        error: null,
      });
      return updatedProduct;
    }
    setState({ isLoading: false, error: 'Failed to update product' });
    return null;
  } catch (error) {
    console.error('Error updating product:', error);
    setState({
      isLoading: false,
      error: 'Failed to update product',
    });
    return null;
  }
}

/**
 * Delete a product from state.
 */
export async function removeProduct(
  state: StoreState,
  setState: (updates: Partial<StoreState>) => void,
  productId: number
): Promise<boolean> {
  setState({ isLoading: true, error: null });

  try {
    const success = await deleteProduct(productId);
    if (success) {
      const filteredProducts = state.products.filter((p) => p.id !== productId);

      setState({
        products: filteredProducts,
        isLoading: false,
        error: null,
      });
      return true;
    }
    setState({ isLoading: false, error: 'Failed to delete product' });
    return false;
  } catch (error) {
    console.error('Error deleting product:', error);
    setState({
      isLoading: false,
      error: 'Failed to delete product',
    });
    return false;
  }
}
