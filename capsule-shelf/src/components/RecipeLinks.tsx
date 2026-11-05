import { getRecipesForCapsule } from "../data/recipeCatalog";
import { localizeRecipe } from "../i18n/catalogContent";
import { useLocale } from "../i18n/locale";

export function RecipeLinks({ capsuleId, onRecipeSelect }: { capsuleId: string; onRecipeSelect: (recipeId: string) => void }) {
  const { locale } = useLocale();
  const matchingRecipes = getRecipesForCapsule(capsuleId).map((recipe) => localizeRecipe(recipe, locale));

  return matchingRecipes.map((recipe) => (
    <a
      href={`#recipe-${recipe.id}`}
      key={recipe.id}
      onClick={(event) => {
        event.preventDefault();
        onRecipeSelect(recipe.id);
      }}
    >
      {recipe.title}
    </a>
  ));
}
