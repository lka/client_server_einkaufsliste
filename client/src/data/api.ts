/**
 * API client for shopping list operations.
 */

import { getToken, clearToken, refreshToken } from './auth.js';

export interface Item {
  id: string;
  name: string;
  menge?: string | null;  // null indicates item was deleted (quantity subtracted to 0)
  shopping_date?: string;
  user_id?: number;
  store_id?: number;
  product_id?: number;
  department_id?: number;
  department_name?: string;
  department_sort_order?: number;
}

export interface Store {
  id: number;
  name: string;
  location?: string;
  sort_order?: number;
}

export interface Department {
  id: number;
  name: string;
  store_id: number;
  sort_order?: number;
}

export interface Product {
  id: number;
  name: string;
  store_id: number;
  department_id: number;
  fresh: boolean;
}

export interface User {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  is_approved: boolean;
  is_admin: boolean;
  created_at: string;
}

export interface TemplateItem {
  id?: number;
  name: string;
  menge?: string;
}

export interface Template {
  id?: number;
  name: string;
  description?: string;
  person_count: number;
  items: TemplateItem[];
}

export interface DeltaItem {
  name: string;
  menge?: string;
}

export interface WeekplanDeltas {
  removed_items: string[];
  added_items: DeltaItem[];
  person_count?: number;
}

export interface WeekplanEntry {
  id?: number;
  date: string;  // ISO format: YYYY-MM-DD
  meal: string;  // 'morning', 'lunch', 'dinner'
  text: string;
  deltas?: WeekplanDeltas;
}

export interface BackupData {
  version: string;
  timestamp: string;
  users: any[];
  stores: any[];
  departments: any[];
  products: any[];
  items: any[];
  templates: any[];
  template_items: any[];
}

export interface RestoreResult {
  message: string;
  restored: {
    users: number;
    stores: number;
    departments: number;
    products: number;
    items: number;
    templates: number;
    template_items: number;
  };
  timestamp: string;
}

export interface VersionInfo {
  version: string;
  api: string;
}

export interface Config {
  main_shopping_day: number;  // Python convention: 0=Monday, 1=Tuesday, ..., 6=Sunday
  fresh_products_day: number;  // Python convention: 0=Monday, 1=Tuesday, ..., 6=Sunday
}

export interface WebDAVSettings {
  id?: number;
  url: string;
  username: string;
  password: string;
  filename: string;
  enabled?: boolean;
}

export const API_BASE = '/api/items';
export const API_STORES = '/api/stores';
export const API_USERS = '/api/users';
export const API_TEMPLATES = '/api/templates';
export const API_BACKUP = '/api/backup';
export const API_VERSION = '/api/version';
export const API_CONFIG = '/api/config';
export const API_WEBDAV = '/api/webdav';

/**
 * Get authorization headers with JWT token.
 */
function getAuthHeaders(): HeadersInit {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Handle 401 responses by clearing token and redirecting to login.
 */
function handleUnauthorized(): void {
  clearToken();
  window.location.href = '/';
}

/**
 * Refresh token before making API calls.
 * This extends the token validity with each API interaction.
 */
async function ensureFreshToken(): Promise<boolean> {
  const token = getToken();
  if (!token) {
    return false;
  }

  // Refresh token to extend its validity
  const refreshed = await refreshToken();
  if (!refreshed) {
    handleUnauthorized();
    return false;
  }

  return true;
}

/**
 * Fetch all items from the API.
 */
export async function fetchItems(): Promise<Item[]> {
  // Refresh token before making the request
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return [];
  }

  try {
    const res = await fetch(API_BASE, {
      headers: getAuthHeaders(),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return [];
    }
    if (!res.ok) {
      console.error('Failed to fetch items:', res.statusText);
      return [];
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching items:', error);
    return [];
  }
}

/**
 * Fetch items for a specific shopping date across all stores.
 */
export async function fetchItemsByDate(
  shoppingDate: string
): Promise<Item[]> {
  // Refresh token before making the request
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return [];
  }

  try {
    const res = await fetch(
      `${API_BASE}/by-date?shopping_date=${shoppingDate}`,
      {
        headers: getAuthHeaders(),
      }
    );
    if (res.status === 401) {
      handleUnauthorized();
      return [];
    }
    if (!res.ok) {
      console.error('Failed to fetch items by date:', res.statusText);
      return [];
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching items by date:', error);
    return [];
  }
}

/**
 * Add a new item to the shopping list.
 */
export async function addItem(
  name: string,
  menge?: string,
  storeId?: number,
  shoppingDate?: string
): Promise<Item | null> {
  // Refresh token before making the request
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return null;
  }

  try {
    const body: { name: string; menge?: string; store_id?: number; shopping_date?: string } = { name };
    if (menge) body.menge = menge;
    if (storeId) body.store_id = storeId;
    if (shoppingDate) body.shopping_date = shoppingDate;

    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return null;
    }
    if (!res.ok) {
      console.error('Failed to add item:', res.statusText);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error('Error adding item:', error);
    return null;
  }
}

/**
 * Delete an item from the shopping list.
 */
export async function deleteItem(id: string): Promise<boolean> {
  // Refresh token before making the request
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return false;
  }

  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return false;
    }
    if (!res.ok) {
      console.error('Failed to delete item:', res.statusText);
    }
    return res.ok;
  } catch (error) {
    console.error('Error deleting item:', error);
    return false;
  }
}

/**
 * Delete all items with shopping_date before the specified date.
 * @param beforeDate - ISO date string (YYYY-MM-DD)
 * @param storeId - Optional store ID to filter items
 */
export async function deleteItemsBeforeDate(beforeDate: string, storeId?: number): Promise<number> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    console.error('Token refresh failed');
    return 0;
  }

  try {
    // Build URL with optional store_id query parameter
    const url = new URL(`${API_BASE}/by-date/${beforeDate}`, window.location.origin);
    if (storeId !== undefined) {
      url.searchParams.append('store_id', storeId.toString());
    }

    const res = await fetch(url.toString(), {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return 0;
    }
    if (!res.ok) {
      console.error('Failed to delete items before date:', res.statusText);
      return 0;
    }
    const result = await res.json();
    return result.deleted_count || 0;
  } catch (error) {
    console.error('Error deleting items before date:', error);
    return 0;
  }
}

/**
 * Convert an item to a product by assigning it to a department.
 * Creates a product in the catalog based on the item name (without quantity).
 */
export async function convertItemToProduct(
  itemId: string,
  departmentId: number
): Promise<Item | null> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    console.error('Token refresh failed');
    return null;
  }

  try {
    const res = await fetch(`/api/items/${itemId}/convert-to-product`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ department_id: departmentId }),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return null;
    }
    if (!res.ok) {
      console.error(
        'Failed to convert item to product:',
        res.status,
        res.statusText
      );
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error('Error converting item to product:', error);
    return null;
  }
}

/**
 * Fetch all stores from the API.
 */
export async function fetchStores(): Promise<Store[]> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return [];
  }

  try {
    const res = await fetch(API_STORES, {
      headers: getAuthHeaders(),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return [];
    }
    if (!res.ok) {
      console.error('Failed to fetch stores:', res.statusText);
      return [];
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching stores:', error);
    return [];
  }
}

/**
 * Fetch all departments for a specific store.
 */
export async function fetchDepartments(storeId: number): Promise<Department[]> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return [];
  }

  try {
    const res = await fetch(`${API_STORES}/${storeId}/departments`, {
      headers: getAuthHeaders(),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return [];
    }
    if (!res.ok) {
      console.error('Failed to fetch departments:', res.statusText);
      return [];
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching departments:', error);
    return [];
  }
}

/**
 * Product suggestion from autocomplete API.
 */
export interface ProductSuggestion {
  name: string;
  source: 'product' | 'template';
}

/**
 * Get product suggestions for autocomplete (includes products and template items).
 */
export async function getProductSuggestions(
  storeId: number,
  query: string,
  limit: number = 10
): Promise<ProductSuggestion[]> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return [];
  }

  if (!query.trim()) {
    return [];
  }

  try {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
    });
    const res = await fetch(
      `/api/stores/${storeId}/products/suggestions?${params}`,
      {
        headers: getAuthHeaders(),
      }
    );
    if (res.status === 401) {
      handleUnauthorized();
      return [];
    }
    if (!res.ok) {
      console.error(
        'Failed to fetch product suggestions:',
        res.status,
        res.statusText
      );
      return [];
    }
    const suggestions: ProductSuggestion[] = await res.json();
    return suggestions;
  } catch (error) {
    console.error('Error fetching product suggestions:', error);
    return [];
  }
}

/**
 * Fetch all products for a specific store.
 */
export async function fetchStoreProducts(storeId: number): Promise<Product[]> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return [];
  }

  try {
    const res = await fetch(`${API_STORES}/${storeId}/products`, {
      headers: getAuthHeaders(),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return [];
    }
    if (!res.ok) {
      console.error('Failed to fetch store products:', res.statusText);
      return [];
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching store products:', error);
    return [];
  }
}

/**
 * Fetch all products for a specific department.
 */
export async function fetchDepartmentProducts(departmentId: number): Promise<Product[]> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return [];
  }

  try {
    const res = await fetch(`/api/departments/${departmentId}/products`, {
      headers: getAuthHeaders(),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return [];
    }
    if (!res.ok) {
      console.error('Failed to fetch department products:', res.statusText);
      return [];
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching department products:', error);
    return [];
  }
}

/**
 * Create a new store.
 */
export async function createStore(name: string, location: string = ''): Promise<Store | null> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return null;
  }

  try {
    const res = await fetch('/api/stores', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name, location }),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return null;
    }
    if (!res.ok) {
      console.error('Failed to create store:', res.statusText);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error('Error creating store:', error);
    return null;
  }
}

/**
 * Update a store.
 */
export async function updateStore(
  storeId: number,
  name?: string,
  location?: string,
  sortOrder?: number
): Promise<Store | null> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return null;
  }

  try {
    const body: Record<string, string | number> = {};
    if (name !== undefined) body.name = name;
    if (location !== undefined) body.location = location;
    if (sortOrder !== undefined) body.sort_order = sortOrder;

    const res = await fetch(`/api/stores/${storeId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return null;
    }
    if (!res.ok) {
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error('Error updating store:', error);
    return null;
  }
}

/**
 * Delete a store.
 */
export async function deleteStore(storeId: number): Promise<boolean> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return false;
  }

  try {
    const res = await fetch(`/api/stores/${storeId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return false;
    }
    return res.ok;
  } catch (error) {
    console.error('Error deleting store:', error);
    return false;
  }
}

/**
 * Create a new department for a store.
 */
export async function createDepartment(
  storeId: number,
  name: string,
  sortOrder: number = 0
): Promise<Department | null> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return null;
  }

  try {
    const res = await fetch(`/api/stores/${storeId}/departments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name, sort_order: sortOrder }),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return null;
    }
    if (!res.ok) {
      console.error('Failed to create department:', res.statusText);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error('Error creating department:', error);
    return null;
  }
}

/**
 * Delete a department.
 */
export async function deleteDepartment(departmentId: number): Promise<boolean> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return false;
  }

  try {
    const res = await fetch(`/api/departments/${departmentId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return false;
    }
    return res.ok;
  } catch (error) {
    console.error('Error deleting department:', error);
    return false;
  }
}

/**
 * Update a department (partial update).
 */
export async function updateDepartment(
  departmentId: number,
  name?: string,
  sortOrder?: number
): Promise<Department | null> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return null;
  }

  try {
    const body: { name?: string; sort_order?: number } = {};

    if (name !== undefined) {
      body.name = name;
    }
    if (sortOrder !== undefined) {
      body.sort_order = sortOrder;
    }

    const res = await fetch(`/api/departments/${departmentId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });

    if (res.status === 401) {
      handleUnauthorized();
      return null;
    }

    if (!res.ok) {
      console.error('Failed to update department:', res.statusText);
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error('Error updating department:', error);
    return null;
  }
}

/**
 * Create a new product.
 */
export async function createProduct(
  name: string,
  storeId: number,
  departmentId: number,
  fresh: boolean = false
): Promise<Product | null> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return null;
  }

  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name,
        store_id: storeId,
        department_id: departmentId,
        fresh,
      }),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return null;
    }
    if (!res.ok) {
      console.error('Failed to create product:', res.statusText);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error('Error creating product:', error);
    return null;
  }
}

/**
 * Update a product.
 */
export async function updateProduct(
  productId: number,
  updates: {
    name?: string;
    storeId?: number;
    departmentId?: number;
    fresh?: boolean;
  }
): Promise<Product | null> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return null;
  }

  try {
    const body: Record<string, string | number | boolean> = {};
    if (updates.name !== undefined) body.name = updates.name;
    if (updates.storeId !== undefined) body.store_id = updates.storeId;
    if (updates.departmentId !== undefined) body.department_id = updates.departmentId;
    if (updates.fresh !== undefined) body.fresh = updates.fresh;

    const res = await fetch(`/api/products/${productId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return null;
    }
    if (!res.ok) {
      console.error('Failed to update product:', res.statusText);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error('Error updating product:', error);
    return null;
  }
}

/**
 * Delete a product.
 */
export async function deleteProduct(productId: number): Promise<boolean> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return false;
  }

  try {
    const res = await fetch(`/api/products/${productId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return false;
    }
    return res.ok;
  } catch (error) {
    console.error('Error deleting product:', error);
    return false;
  }
}

/**
 * Fetch all users.
 */
export async function fetchAllUsers(): Promise<User[]> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return [];
  }

  try {
    const res = await fetch(API_USERS, {
      headers: getAuthHeaders(),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return [];
    }
    if (!res.ok) {
      console.error('Failed to fetch users:', res.statusText);
      return [];
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

/**
 * Fetch pending (unapproved) users.
 */
export async function fetchPendingUsers(): Promise<User[]> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return [];
  }

  try {
    const res = await fetch(`${API_USERS}/pending`, {
      headers: getAuthHeaders(),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return [];
    }
    if (!res.ok) {
      console.error('Failed to fetch pending users:', res.statusText);
      return [];
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching pending users:', error);
    return [];
  }
}

/**
 * Approve a user.
 */
export async function approveUser(userId: number): Promise<User | null> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return null;
  }

  try {
    const res = await fetch(`${API_USERS}/${userId}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return null;
    }
    if (!res.ok) {
      console.error('Failed to approve user:', res.statusText);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error('Error approving user:', error);
    return null;
  }
}

/**
 * Delete a user (admin only).
 */
export async function deleteUser(userId: number): Promise<boolean> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return false;
  }

  try {
    const res = await fetch(`${API_USERS}/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return false;
    }
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: res.statusText }));
      console.error('Failed to delete user:', errorData.detail || res.statusText);
      alert(`Fehler beim Löschen: ${errorData.detail || res.statusText}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
}

// ==================== Template API ====================

/**
 * Fetch all shopping templates.
 */
export async function fetchTemplates(): Promise<Template[]> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    console.error('Token refresh failed');
    return [];
  }

  try {
    const res = await fetch(API_TEMPLATES, {
      headers: getAuthHeaders(),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return [];
    }
    if (!res.ok) {
      console.error('Failed to fetch templates:', res.statusText);
      return [];
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching templates:', error);
    return [];
  }
}

/**
 * Fetch a specific template by ID.
 */
export async function fetchTemplate(templateId: number): Promise<Template | null> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    console.error('Token refresh failed');
    return null;
  }

  try {
    const res = await fetch(`${API_TEMPLATES}/${templateId}`, {
      headers: getAuthHeaders(),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return null;
    }
    if (!res.ok) {
      console.error('Failed to fetch template:', res.statusText);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching template:', error);
    return null;
  }
}

/**
 * Create a new shopping template.
 */
export async function createTemplate(
  name: string,
  description: string | undefined,
  personCount: number,
  items: TemplateItem[]
): Promise<Template | null> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    console.error('Token refresh failed');
    return null;
  }

  try {
    const res = await fetch(API_TEMPLATES, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name, description, person_count: personCount, items }),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return null;
    }
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: res.statusText }));
      console.error('Failed to create template:', errorData.detail || res.statusText);
      alert(`Fehler beim Erstellen: ${errorData.detail || res.statusText}`);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error('Error creating template:', error);
    return null;
  }
}

/**
 * Update an existing template.
 */
export async function updateTemplate(
  templateId: number,
  name?: string,
  description?: string,
  personCount?: number,
  items?: TemplateItem[]
): Promise<Template | null> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    console.error('Token refresh failed');
    return null;
  }

  const body: any = {};
  if (name !== undefined) body.name = name;
  if (description !== undefined) body.description = description;
  if (personCount !== undefined) body.person_count = personCount;
  if (items !== undefined) body.items = items;

  try {
    const res = await fetch(`${API_TEMPLATES}/${templateId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return null;
    }
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: res.statusText }));
      console.error('Failed to update template:', errorData.detail || res.statusText);
      alert(`Fehler beim Aktualisieren: ${errorData.detail || res.statusText}`);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error('Error updating template:', error);
    return null;
  }
}

/**
 * Delete a template.
 */
export async function deleteTemplate(templateId: number): Promise<boolean> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    console.error('Token refresh failed');
    return false;
  }

  try {
    const res = await fetch(`${API_TEMPLATES}/${templateId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return false;
    }
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: res.statusText }));
      console.error('Failed to delete template:', errorData.detail || res.statusText);
      alert(`Fehler beim Löschen: ${errorData.detail || res.statusText}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error deleting template:', error);
    return false;
  }
}

/**
 * Create a database backup.
 * Returns JSON backup data that can be saved as a file.
 */
export async function createBackup(): Promise<BackupData | null> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    console.error('Token refresh failed');
    return null;
  }

  try {
    const res = await fetch(API_BACKUP, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return null;
    }
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: res.statusText }));
      console.error('Failed to create backup:', errorData.detail || res.statusText);
      alert(`Fehler beim Backup: ${errorData.detail || res.statusText}`);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error('Error creating backup:', error);
    return null;
  }
}

/**
 * Restore database from backup JSON data.
 * @param backupData - The backup data to restore
 * @param clearExisting - Whether to clear existing data first (default: true)
 */
export async function restoreBackup(
  backupData: BackupData,
  clearExisting: boolean = true
): Promise<RestoreResult | null> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    console.error('Token refresh failed');
    return null;
  }

  try {
    const url = `${API_BACKUP}/restore?clear_existing=${clearExisting}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(backupData),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return null;
    }
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: res.statusText }));
      console.error('Failed to restore backup:', errorData.detail || res.statusText);
      alert(`Fehler beim Restore: ${errorData.detail || res.statusText}`);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error('Error restoring backup:', error);
    return null;
  }
}

/**
 * Get application version information.
 * This endpoint does not require authentication.
 */
export async function getVersion(): Promise<VersionInfo | null> {
  try {
    const res = await fetch(API_VERSION, {
      method: 'GET',
    });
    if (!res.ok) {
      console.error('Failed to fetch version:', res.statusText);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching version:', error);
    return null;
  }
}

/**
 * Get weekplan entries for a specific week
 */
export async function getWeekplanEntries(weekStart: string): Promise<WeekplanEntry[]> {
  const token = getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  try {
    const res = await fetch(`/api/weekplan/entries?week_start=${weekStart}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (res.status === 401) {
      clearToken();
      throw new Error('Session expired');
    }

    if (!res.ok) {
      throw new Error(`Failed to fetch weekplan entries: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error('Error fetching weekplan entries:', error);
    throw error;
  }
}

/**
 * Create a new weekplan entry
 */
export async function createWeekplanEntry(entry: Omit<WeekplanEntry, 'id'>): Promise<WeekplanEntry> {
  const token = getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  try {
    const res = await fetch('/api/weekplan/entries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(entry),
    });

    if (res.status === 401) {
      clearToken();
      throw new Error('Session expired');
    }

    if (!res.ok) {
      throw new Error(`Failed to create weekplan entry: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error('Error creating weekplan entry:', error);
    throw error;
  }
}

/**
 * Get weekplan entry suggestions based on query
 * Returns up to maxSuggestions unique template names
 */
export async function getWeekplanSuggestions(query: string, maxSuggestions: number = 5): Promise<string[]> {
  try {
    // Fetch all templates
    const templates = await fetchTemplates();

    // Extract only template names
    const templateNames: string[] = [];
    for (const template of templates) {
      if (template.name && template.name.trim()) {
        templateNames.push(template.name.trim());
      }
    }

    // Filter by query, sort alphabetically, and limit
    const lowerQuery = query.toLowerCase();
    const matches = templateNames
      .filter(name => name.toLowerCase().includes(lowerQuery))
      .sort()
      .slice(0, maxSuggestions);

    return matches;
  } catch (error) {
    console.error('Error fetching weekplan suggestions:', error);
    return [];
  }
}

/**
 * Delete a weekplan entry
 */
export async function deleteWeekplanEntry(entryId: number): Promise<void> {
  const token = getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  try {
    const res = await fetch(`/api/weekplan/entries/${entryId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (res.status === 401) {
      clearToken();
      throw new Error('Session expired');
    }

    if (!res.ok) {
      throw new Error(`Failed to delete weekplan entry: ${res.statusText}`);
    }
  } catch (error) {
    console.error('Error deleting weekplan entry:', error);
    throw error;
  }
}

/**
 * Update the deltas for a weekplan entry.
 */
export async function updateWeekplanEntryDeltas(
  entryId: number,
  deltas: WeekplanDeltas
): Promise<WeekplanEntry> {
  const token = getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  try {
    const res = await fetch(`/api/weekplan/entries/${entryId}/deltas`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deltas),
    });

    if (res.status === 401) {
      clearToken();
      throw new Error('Session expired');
    }

    if (!res.ok) {
      throw new Error(`Failed to update weekplan entry deltas: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error('Error updating weekplan entry deltas:', error);
    throw error;
  }
}

/**
 * Get server configuration.
 * This endpoint does not require authentication.
 */
export async function getConfig(): Promise<Config | null> {
  try {
    const res = await fetch(API_CONFIG, {
      method: 'GET',
    });
    if (!res.ok) {
      console.error('Failed to fetch config:', res.statusText);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching config:', error);
    return null;
  }
}

/**
 * Fetch all WebDAV settings (requires authentication).
 */
export async function fetchWebDAVSettings(): Promise<WebDAVSettings[]> {
  const token = getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  try {
    const res = await fetch(API_WEBDAV, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (res.status === 401) {
      clearToken();
      throw new Error('Session expired');
    }

    if (!res.ok) {
      throw new Error(`Failed to fetch WebDAV settings: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error('Error fetching WebDAV settings:', error);
    throw error;
  }
}

/**
 * Create new WebDAV settings (requires authentication).
 */
export async function createWebDAVSettings(settings: WebDAVSettings): Promise<WebDAVSettings> {
  const token = getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  try {
    const res = await fetch(API_WEBDAV, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });

    if (res.status === 401) {
      clearToken();
      throw new Error('Session expired');
    }

    if (!res.ok) {
      throw new Error(`Failed to create WebDAV settings: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error('Error creating WebDAV settings:', error);
    throw error;
  }
}

/**
 * Update existing WebDAV settings (requires authentication).
 */
export async function updateWebDAVSettings(id: number, settings: Partial<WebDAVSettings>): Promise<WebDAVSettings> {
  const token = getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  try {
    const res = await fetch(`${API_WEBDAV}/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });

    if (res.status === 401) {
      clearToken();
      throw new Error('Session expired');
    }

    if (!res.ok) {
      throw new Error(`Failed to update WebDAV settings: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error('Error updating WebDAV settings:', error);
    throw error;
  }
}

/**
 * Delete WebDAV settings (requires authentication).
 */
export async function deleteWebDAVSettings(id: number): Promise<void> {
  const token = getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  try {
    const res = await fetch(`${API_WEBDAV}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (res.status === 401) {
      clearToken();
      throw new Error('Session expired');
    }

    if (!res.ok) {
      throw new Error(`Failed to delete WebDAV settings: ${res.statusText}`);
    }
  } catch (error) {
    console.error('Error deleting WebDAV settings:', error);
    throw error;
  }
}
