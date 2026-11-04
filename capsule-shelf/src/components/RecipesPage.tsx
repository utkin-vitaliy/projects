import { useEffect, useState } from "react";
import { recipes } from "../data/recipes";
import { useLocale } from "../i18n/locale";
import { localizeRecipe } from "../i18n/catalogContent";

type RecipeFilter = "all" | "favorites" | "hot" | "cold";
const RECIPE_FAVORITES_KEY = "capsule-shelf:recipe-favorites:v1";

function loadFavoriteIds(): string[] {
  try {
    const saved: unknown = JSON.parse(window.localStorage.getItem(RECIPE_FAVORITES_KEY) ?? "[]");
    return Array.isArray(saved) ? saved.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}
export function RecipesPage({ favoriteIds: controlledFavoriteIds, onFavoriteIdsChange }: { favoriteIds?: string[]; onFavoriteIdsChange?: (ids: string[]) => void } = {}) {
  const { locale, t } = useLocale();
  const [filter, setFilter] = useState<RecipeFilter>("all");
  const [search, setSearch] = useState("");
  const [localFavoriteIds, setLocalFavoriteIds] = useState<string[]>(loadFavoriteIds);
  const favoriteIds = controlledFavoriteIds ?? localFavoriteIds;
  const normalizedSearch = normalizeSearch(search);
  const visibleRecipes = recipes
    .filter((recipe) => filter === "all"
      || (filter === "favorites" ? favoriteIds.includes(recipe.id) : recipe.temperature === filter))
    .filter((recipe) => (["en", "ru", "fr"] as const).some((searchLocale) => {
      const translatedRecipe = localizeRecipe(recipe, searchLocale);
      return normalizeSearch(translatedRecipe.title).includes(normalizedSearch)
        || normalizeSearch(translatedRecipe.capsule).includes(normalizedSearch);
    }));

  useEffect(() => {
    if (controlledFavoriteIds !== undefined) return;
    try { window.localStorage.setItem(RECIPE_FAVORITES_KEY, JSON.stringify(favoriteIds)); } catch { /* Keep in-memory favorites usable. */ }
  }, [favoriteIds, controlledFavoriteIds]);

  function toggleFavorite(recipeId: string) {
    const updated = favoriteIds.includes(recipeId)
      ? favoriteIds.filter((id) => id !== recipeId)
      : [...favoriteIds, recipeId];
    if (controlledFavoriteIds !== undefined) onFavoriteIdsChange?.(updated);
    else setLocalFavoriteIds(updated);
  }

  return (
    <section className="recipes-section" id="recipes" aria-labelledby="recipes-title">
      <div className="recipes-toolbar">
        <header className="recipes-heading">
          <h2 id="recipes-title">{t("recipeHeading")}</h2>
        </header>

        <div className="recipe-toolbar-controls">
          <label className="search-field">
            <svg aria-hidden="true" viewBox="0 0 20 20"><circle cx="8.8" cy="8.8" r="5.8"/><path d="m13.2 13.2 4 4"/></svg>
            <input aria-label={t("searchRecipes")} onChange={(event) => setSearch(event.target.value)} placeholder={t("searchRecipes")} type="search" value={search} />
          </label>
          <div className="recipe-filters" role="group" aria-label={t("recipeFilterAria")}>
          {([
            ["all", "allRecipes"],
            ["favorites", "favoriteRecipes"],
            ["hot", "hot"],
            ["cold", "cold"],
          ] as const).map(([value, label]) => {
            const count = value === "all" ? recipes.length : value === "favorites" ? favoriteIds.length : recipes.filter((recipe) => recipe.temperature === value).length;
            return (
              <button
                aria-pressed={filter === value}
                className={`recipe-filter${filter === value ? " is-active" : ""}`}
                key={value}
                onClick={() => setFilter(value)}
                type="button"
              >
                {t(label)} <span>{count}</span>
              </button>
            );
          })}
          </div>
        </div>
      </div>

      <div className="recipe-grid">
        {visibleRecipes.length === 0 && <div className="empty-filter" role="status"><span aria-hidden="true">⌕</span><p>{filter === "favorites" && !normalizedSearch ? t("noFavoriteRecipes") : t("noSearchResults")}</p></div>}
        {visibleRecipes.map((item) => {
          const recipe = localizeRecipe(item, locale);
          const isFavorite = favoriteIds.includes(recipe.id);
          return (
          <article className="recipe-card" id={`recipe-${recipe.id}`} key={recipe.id} tabIndex={-1}>
            <button
              aria-label={isFavorite ? t("removeRecipeFavorite", { name: recipe.title }) : t("addRecipeFavorite", { name: recipe.title })}
              aria-pressed={isFavorite}
              className={`favorite-button${isFavorite ? " is-favorite" : ""}`}
              onClick={() => toggleFavorite(recipe.id)}
              title={isFavorite ? t("favoriteTitleRemove") : t("favoriteTitleAdd")}
              type="button"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20.8 8.7c0 5.1-8.8 10.2-8.8 10.2S3.2 13.8 3.2 8.7A4.7 4.7 0 0 1 12 6.3a4.7 4.7 0 0 1 8.8 2.4Z" /></svg>
            </button>
            <div className={`recipe-card__photo${recipe.sourcePage ? " recipe-card__photo--book" : ""}`}>
              <RecipeImage src={recipe.imageUrl} alt={recipe.imageAlt} unavailableLabel={t("recipeImageUnavailable")} />
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

function RecipeImage({ src, alt, unavailableLabel }: { src: string; alt: string; unavailableLabel: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  if (failed) {
    return <div aria-label={unavailableLabel} className="recipe-image-fallback" role="img"><svg aria-hidden="true" viewBox="0 0 100 100"><path d="M26 39h43l-4 38H31zM69 46h8a9 9 0 0 1 0 18h-9M31 34c-4-5 4-6 0-11m17 11c-4-5 4-6 0-11m17 11c-4-5 4-6 0-11"/><path d="M37 51h22"/></svg></div>;
  }
  return <img alt={alt} loading="lazy" onError={() => setFailed(true)} src={src} />;
}

function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase();
}
