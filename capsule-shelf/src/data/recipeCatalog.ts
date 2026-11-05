import type { CoffeeRecipe } from "./recipes";
import { recipes } from "./recipes";
import { vertuoRecipes } from "./vertuoRecipes";

export const allRecipes: CoffeeRecipe[] = [...recipes, ...vertuoRecipes];

const recipesByCapsule = new Map<string, CoffeeRecipe[]>();
const allOriginalRecipes: CoffeeRecipe[] = [];

for (const recipe of allRecipes) {
  if (recipe.allOriginalCapsules) allOriginalRecipes.push(recipe);
  for (const capsuleId of recipe.capsuleIds) {
    const matchingRecipes = recipesByCapsule.get(capsuleId) ?? [];
    matchingRecipes.push(recipe);
    recipesByCapsule.set(capsuleId, matchingRecipes);
  }
}

export function getRecipesForCapsule(capsuleId: string): CoffeeRecipe[] {
  const matchingRecipes = recipesByCapsule.get(capsuleId) ?? [];
  return capsuleId.startsWith("vertuo-") ? matchingRecipes : [...allOriginalRecipes, ...matchingRecipes];
}
