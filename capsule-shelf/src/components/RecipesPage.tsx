import { Fragment, useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { allRecipes } from "../data/recipeCatalog";
import type { CoffeeSystem, RecipeFilter } from "../storage/userSettings";
import { useLocale } from "../i18n/locale";
import { localizeRecipe } from "../i18n/catalogContent";

const RECIPE_FAVORITES_KEY = "capsule-shelf:recipe-favorites:v1";

function loadFavoriteIds(): string[] {
  try {
    const saved: unknown = JSON.parse(window.localStorage.getItem(RECIPE_FAVORITES_KEY) ?? "[]");
    return Array.isArray(saved) ? saved.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}
export function RecipesPage({ system, activeFilter, onFilterChange, favoriteIds: controlledFavoriteIds, onFavoriteIdsChange, initialFocusRecipeId, onFocusRecipeChange }: { system: CoffeeSystem; activeFilter?: RecipeFilter; onFilterChange?: (filter: RecipeFilter) => void; favoriteIds?: string[]; onFavoriteIdsChange?: (ids: string[]) => void; initialFocusRecipeId?: string | null; onFocusRecipeChange?: (id: string | null) => void }) {
  const { locale, t } = useLocale();
  const [localFilter, setLocalFilter] = useState<RecipeFilter>("all");
  const filter = activeFilter ?? localFilter;
  const [search, setSearch] = useState("");
  const [localFavoriteIds, setLocalFavoriteIds] = useState<string[]>(loadFavoriteIds);
  const [focusedRecipeId, setFocusedRecipeId] = useState<string | null>(null);
  const [focusMotion, setFocusMotion] = useState<{ x: number; y: number; scale: number; height: number } | null>(null);
  const previousScrollY = useRef(0);
  const returnFocusTarget = useRef<HTMLElement | null>(null);
  const favoriteIds = controlledFavoriteIds ?? localFavoriteIds;
  const normalizedSearch = normalizeSearch(search);
  const line = system === "vertuo" ? "Vertuo" : "Original";
  const systemRecipes = allRecipes.filter((recipe) => recipe.line === line);
  const systemFavoriteCount = systemRecipes.filter((recipe) => favoriteIds.includes(recipe.id)).length;
  const visibleRecipes = systemRecipes
    .filter((recipe) => filter === "all"
      || (filter === "favorites" ? favoriteIds.includes(recipe.id) : recipe.temperature === filter))
    .filter((recipe) => (["en", "ru", "fr"] as const).some((searchLocale) => {
      const translatedRecipe = localizeRecipe(recipe, searchLocale);
      return normalizeSearch(translatedRecipe.title).includes(normalizedSearch)
        || normalizeSearch(translatedRecipe.capsule).includes(normalizedSearch);
    }));

  function selectFilter(nextFilter: RecipeFilter) {
    if (onFilterChange) onFilterChange(nextFilter);
    else setLocalFilter(nextFilter);
  }

  useEffect(() => {
    if (controlledFavoriteIds !== undefined) return;
    try { window.localStorage.setItem(RECIPE_FAVORITES_KEY, JSON.stringify(favoriteIds)); } catch { /* Keep in-memory favorites usable. */ }
  }, [favoriteIds, controlledFavoriteIds]);

  function openFocusedRecipe(recipeId: string, card: HTMLElement) {
    const rect = card.getBoundingClientRect();
    const targetWidth = Math.min(960, Math.max(320, window.innerWidth - 48));
    previousScrollY.current = window.scrollY;
    returnFocusTarget.current = card;
    setFocusMotion({
      x: rect.left + rect.width / 2 - window.innerWidth / 2,
      y: rect.top + rect.height / 2 - (window.innerHeight / 2 - 24),
      scale: Math.min(1, rect.width / targetWidth),
      height: rect.height,
    });
    setFocusedRecipeId(recipeId);
  }

  function closeFocusedRecipe() {
    setFocusedRecipeId(null);
    setFocusMotion(null);
    onFocusRecipeChange?.(null);
    window.requestAnimationFrame(() => {
      if (window.scrollY !== previousScrollY.current) window.scrollTo(0, previousScrollY.current);
      returnFocusTarget.current?.focus({ preventScroll: true });
    });
  }

  useEffect(() => {
    if (!focusedRecipeId) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const card = document.getElementById(`recipe-${focusedRecipeId}`);
    card?.focus({ preventScroll: true });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeFocusedRecipe();
        return;
      }
      if (event.key !== "Tab" || !card) return;
      const focusable = Array.from(card.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'));
      if (!focusable.length) {
        event.preventDefault();
        card.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !card.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !card.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [focusedRecipeId]);

  useEffect(() => {
    if (!initialFocusRecipeId || !systemRecipes.some(({ id }) => id === initialFocusRecipeId)) return;
    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(`recipe-${initialFocusRecipeId}`);
      if (!(target instanceof HTMLElement)) return;
      target.scrollIntoView?.({ behavior: "smooth", block: "center" });
      openFocusedRecipe(initialFocusRecipeId, target);
      onFocusRecipeChange?.(null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [initialFocusRecipeId, system]);

  function toggleFavorite(recipeId: string) {
    const updated = favoriteIds.includes(recipeId)
      ? favoriteIds.filter((id) => id !== recipeId)
      : [...favoriteIds, recipeId];
    if (controlledFavoriteIds !== undefined) onFavoriteIdsChange?.(updated);
    else setLocalFavoriteIds(updated);
  }

  return (
    <section className={`recipes-section${focusedRecipeId ? " recipes-section--focused" : ""}`} id="recipes" aria-labelledby="recipes-title">
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
            const count = value === "all" ? systemRecipes.length : value === "favorites" ? systemFavoriteCount : systemRecipes.filter((recipe) => recipe.temperature === value).length;
            return (
              <button
                aria-pressed={filter === value}
                className={`recipe-filter${filter === value ? " is-active" : ""}`}
                key={value}
                onClick={() => selectFilter(value)}
                type="button"
              >
                {t(label)} <span>{count}</span>
              </button>
            );
          })}
          </div>
        </div>
      </div>

      {focusedRecipeId && <div aria-hidden="true" className="recipe-focus-backdrop" onClick={closeFocusedRecipe} />}
      <div className="recipe-grid">
        {visibleRecipes.length === 0 && <div className="empty-filter" role="status"><span aria-hidden="true">⌕</span><p>{filter === "favorites" && !normalizedSearch ? t("noFavoriteRecipes") : t("noSearchResults")}</p></div>}
        {visibleRecipes.map((item) => {
          const recipe = localizeRecipe(item, locale);
          const isFavorite = favoriteIds.includes(recipe.id);
          return (
          <Fragment key={recipe.id}>
          {focusedRecipeId === recipe.id && <div aria-hidden="true" className="recipe-card-placeholder" style={{ height: focusMotion?.height }} />}
          <article
            aria-label={focusedRecipeId === recipe.id ? recipe.title : undefined}
            aria-modal={focusedRecipeId === recipe.id || undefined}
            className={`recipe-card${focusedRecipeId === recipe.id ? " recipe-card--focused" : ""}`}
            id={`recipe-${recipe.id}`}
            onClick={(event: MouseEvent<HTMLElement>) => {
              if (focusedRecipeId === recipe.id || (event.target as HTMLElement).closest("button, a, input, textarea")) return;
              openFocusedRecipe(recipe.id, event.currentTarget);
            }}
            role={focusedRecipeId === recipe.id ? "dialog" : undefined}
            style={focusedRecipeId === recipe.id && focusMotion ? {
              "--focus-from-x": `${focusMotion.x}px`,
              "--focus-from-y": `${focusMotion.y}px`,
              "--focus-from-scale": focusMotion.scale,
            } as CSSProperties : undefined}
            tabIndex={-1}
          >
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
            <div className={`recipe-card__photo${recipe.sourcePage ? " recipe-card__photo--book" : ""}${focusedRecipeId === recipe.id ? " recipe-card__photo--focused" : ""}`}>
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

            <div className={`recipe-card__body${focusedRecipeId === recipe.id ? " recipe-card__body--vertical" : ""}`}>
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
          </Fragment>
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
