/**
 * Shared TypeScript interfaces and constants for API operations.
 */

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
  recipe_id?: number;  // Optional recipe reference
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

export interface ProductSuggestion {
  name: string;
  source: 'product' | 'template';
}

export interface Unit {
  id: number;
  name: string;
  sort_order: number;
}

// API endpoint constants
export const API_BASE = '/api/items';
export const API_STORES = '/api/stores';
export const API_USERS = '/api/users';
export const API_TEMPLATES = '/api/templates';
export const API_BACKUP = '/api/backup';
export const API_VERSION = '/api/version';
export const API_CONFIG = '/api/config';
export const API_WEBDAV = '/api/webdav';
export const API_WEEKPLAN = '/api/weekplan';
export const API_UNITS = '/api/units';
