import { useEffect, useState } from "react";
import { recipes } from "../data/recipes";
import { useLocale } from "../i18n/locale";
import { localizeRecipe } from "../i18n/catalogContent";

type RecipeTemperature = "all" | "hot" | "cold";
type Props = {
  targetRecipeId?: string | null;
  onTargetHandled?: () => void;
};

export function RecipesPage({ targetRecipeId = null, onTargetHandled = () => undefined }: Props) {
  const { locale, t } = useLocale();
  const [temperature, setTemperature] = useState<RecipeTemperature>("all");
  const visibleRecipes = temperature === "all"
    ? recipes
    : recipes.filter((recipe) => recipe.temperature === temperature);

  useEffect(() => {
    if (!targetRecipeId) return;
    const target = document.getElementById(`recipe-${targetRecipeId}`);
    if (!target) return;
    target.scrollIntoView?.({ behavior: "smooth", block: "center" });
    target.focus({ preventScroll: true });
    onTargetHandled();
  }, [onTargetHandled, targetRecipeId]);

  return (
    <section className="recipes-section" aria-labelledby="recipes-title">
      <div className="recipes-toolbar">
        <header className="recipes-heading">
          <h2 id="recipes-title">{t("recipeHeading")}</h2>
        </header>

        <div className="recipe-filters" role="group" aria-label={t("temperatureFilter")}>
          {([
            ["all", "all"],
            ["hot", "hot"],
            ["cold", "cold"],
          ] as const).map(([value, label]) => {
            const count = value === "all" ? recipes.length : recipes.filter((recipe) => recipe.temperature === value).length;
            return (
              <button
                aria-pressed={temperature === value}
                className={`recipe-filter${temperature === value ? " is-active" : ""}`}
                key={value}
                onClick={() => setTemperature(value)}
                type="button"
              >
                {t(label)} <span>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="recipe-grid">
        {visibleRecipes.map((item) => {
          const recipe = localizeRecipe(item, locale);
          return (
          <article className="recipe-card" id={`recipe-${recipe.id}`} key={recipe.id} tabIndex={-1}>
            <div className={`recipe-card__photo${recipe.sourcePage ? " recipe-card__photo--book" : ""}`}>
              <img src={recipe.imageUrl} alt={recipe.imageAlt} loading="lazy" />
            </div>
            <div className="recipe-card__meta">
              <span>{recipe.line}</span>
              <span>{recipe.time}</span>
              <span>{recipe.difficulty}</span>
            </div>
            <h3>{recipe.title}</h3>
            <p className="recipe-card__capsule">{t("capsuleLabel")} <strong>{recipe.capsule}</strong></p>
            {recipe.adaptationNote && <p className="recipe-card__adaptation">{recipe.adaptationNote}</p>}

            <div className="recipe-card__body">
              <div>
                <h4>{t("ingredients")}</h4>
                <ul aria-label={t("ingredients")}>
                  {recipe.ingredients.map((ingredient) => <li key={ingredient}>{ingredient}</li>)}
                </ul>
              </div>
              <div>
                <h4>{t("preparation")}</h4>
                <ol aria-label={t("preparation")}>
                  {recipe.steps.map((step) => <li key={step}>{step}</li>)}
                </ol>
              </div>
            </div>

            <a className="recipe-card__source" href={recipe.sourceUrl} rel="noreferrer" target="_blank">
              {recipe.sourceLabel} <span aria-hidden="true">↗</span>
            </a>
          </article>
          );
        })}
      </div>
    </section>
  );
}
