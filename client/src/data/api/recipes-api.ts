/**
 * Recipes API operations.
 */

import { getAuthHeaders } from './utils.js';

/**
 * Search recipes by name.
 *
 * @param query - Search query string
 * @param limit - Maximum number of results (default: 10)
 * @returns Promise resolving to array of recipe matches
 */
export async function searchRecipes(
  query: string,
  limit: number = 10
): Promise<readonly { id: number; name: string }[]> {
  try {
    const response = await fetch(
      `/api/recipes/search?query=${encodeURIComponent(query)}&limit=${limit}`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to search recipes: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error searching recipes:', error);
    throw error;
  }
}

/**
 * Get recipe details by ID.
 *
 * @param recipeId - Recipe ID
 * @returns Promise resolving to recipe details
 */
export async function getRecipe(recipeId: number): Promise<any> {
  try {
    const response = await fetch(`/api/recipes/${recipeId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get recipe: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting recipe:', error);
    throw error;
  }
}
