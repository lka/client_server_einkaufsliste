/**
 * Autocomplete helper functions for entry input
 */

import { fetchTemplates } from '../../../data/api/templates-api.js';
import { searchRecipes } from '../../../data/api/recipes-api.js';

type SuggestionItem = {
  id: string;
  label: string;
  data: string;
  name?: string;
};

export const MAX_SUGGESTIONS = 10;

/**
 * Search for suggestions (templates and recipes)
 */
export async function searchSuggestions(query: string): Promise<SuggestionItem[]> {
  // Fetch templates, recipes in parallel
  const [templates, recipeSuggestions] = await Promise.all([
    fetchTemplates().catch(() => []),
    searchRecipes(query, MAX_SUGGESTIONS).catch(() => []) // Fallback to empty array on error
  ]);

  // Filter templates by query
  const lowerQuery = query.toLowerCase();
  const templateSuggestions = templates
    .filter(t => t.name.toLowerCase().includes(lowerQuery))
    .slice(0, MAX_SUGGESTIONS);

  // Combine both suggestion types - templates first, then recipes
  const combined: SuggestionItem[] = [
    ...templateSuggestions.map(template => ({
      id: `template-${template.id}`,
      label: template.name,
      data: template.name,
    })),
    ...recipeSuggestions.map(recipe => ({
      id: `recipe-${recipe.id}`,
      label: `🍳 ${recipe.name}`,
      data: recipe.name,
      name: recipe.name, // Store original name for duplicate detection
    }))
  ];

  // Add numbering to recipes with duplicate names
  const numberedCombined = addNumberingToDuplicates(combined);

  // Limit to maxSuggestions
  return numberedCombined.slice(0, MAX_SUGGESTIONS);
}

/**
 * Add numbering to recipes with duplicate names
 */
function addNumberingToDuplicates(items: SuggestionItem[]): SuggestionItem[] {
  const recipeNameCounts = new Map<string, number>();
  const recipeNameIndices = new Map<string, number>();

  // Count occurrences of each recipe name
  items.forEach(item => {
    if (item.id.startsWith('recipe-') && item.name) {
      recipeNameCounts.set(item.name, (recipeNameCounts.get(item.name) || 0) + 1);
    }
  });

  // Add numbering only to duplicates
  return items.map(item => {
    if (item.id.startsWith('recipe-') && item.name) {
      const count = recipeNameCounts.get(item.name) || 0;
      if (count > 1) {
        const index = (recipeNameIndices.get(item.name) || 0) + 1;
        recipeNameIndices.set(item.name, index);
        return {
          ...item,
          label: `🍳 ${item.name} (${index})`,
        };
      }
    }
    return item;
  });
}

/**
 * Parse suggestion ID to extract type and ID
 */
export function parseSuggestionId(suggestionId: string): {
  recipeId?: number;
  templateId?: number;
  entryType: 'text' | 'template' | 'recipe';
} {
  if (suggestionId.startsWith('recipe-')) {
    return {
      recipeId: parseInt(suggestionId.replace('recipe-', '')),
      entryType: 'recipe'
    };
  } else if (suggestionId.startsWith('template-')) {
    return {
      templateId: parseInt(suggestionId.replace('template-', '')),
      entryType: 'template'
    };
  } else {
    return {
      entryType: 'text'
    };
  }
}
