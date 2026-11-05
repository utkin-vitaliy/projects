import type { CoffeeRecipe } from "./recipes";
import { recipes } from "./recipes";
import { capsules as originalCapsules } from "./capsules";
import { vertuoCapsules } from "./vertuoCapsules";
import { vertuoRecipes } from "./vertuoRecipes";

export const allRecipes: CoffeeRecipe[] = [...recipes, ...vertuoRecipes];

export function getRecipesForCapsule(capsuleId: string): CoffeeRecipe[] {
  const line = originalCapsules.some(({ id }) => id === capsuleId)
    ? "Original"
    : vertuoCapsules.some(({ id }) => id === capsuleId) ? "Vertuo" : null;
  if (!line) return [];

  return allRecipes.filter((recipe) =>
    recipe.line === line
      && ((line === "Original" && recipe.allOriginalCapsules === true)
        || recipe.capsuleIds.includes(capsuleId)),
  );
}
