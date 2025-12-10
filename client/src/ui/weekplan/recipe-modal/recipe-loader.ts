/**
 * Recipe loading and fetching logic.
 */

import { getRecipe, searchRecipes } from '../../../data/api.js';

/**
 * Load recipe by ID.
 */
export async function loadRecipeById(recipeId: number): Promise<{ name: string; data: any }> {
  const recipe = await getRecipe(recipeId);
  const recipeData = typeof recipe.data === 'string' ? JSON.parse(recipe.data) : recipe.data;
  return { name: recipe.name, data: recipeData };
}

/**
 * Load recipe by name.
 */
export async function loadRecipeByName(recipeName: string): Promise<{ name: string; data: any } | null> {
  const recipes = await searchRecipes(recipeName, 10);
  const matchingRecipe = recipes.find(r => r.name.toLowerCase() === recipeName.toLowerCase());

  if (!matchingRecipe) {
    return null;
  }

  const recipe = await getRecipe(matchingRecipe.id);
  const recipeData = typeof recipe.data === 'string' ? JSON.parse(recipe.data) : recipe.data;
  return { name: recipe.name, data: recipeData };
}
