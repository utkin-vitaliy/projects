import { Fragment, useEffect, useRef, useState, type CSSProperties, type FormEvent, type MouseEvent } from "react";
import { allRecipes } from "../data/recipeCatalog";
import type { CoffeeSystem, RecipeEdits, RecipeFilter, RecipeTextOverride } from "../storage/userSettings";
import { useLocale, type Locale } from "../i18n/locale";
import { localizeRecipe } from "../i18n/catalogContent";
import { moveRecipeLine } from "../domain/recipeEditor";

const RECIPE_FAVORITES_KEY = "capsule-shelf:recipe-favorites:v1";

function loadFavoriteIds(): string[] {
  try {
    const saved: unknown = JSON.parse(window.localStorage.getItem(RECIPE_FAVORITES_KEY) ?? "[]");
    return Array.isArray(saved) ? saved.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}
export function RecipesPage({ system, activeFilter, onFilterChange, favoriteIds: controlledFavoriteIds, onFavoriteIdsChange, recipeEdits: controlledRecipeEdits, onRecipeEdit, onRecipeReset, initialFocusRecipeId, onFocusRecipeChange }: { system: CoffeeSystem; activeFilter?: RecipeFilter; onFilterChange?: (filter: RecipeFilter) => void; favoriteIds?: string[]; onFavoriteIdsChange?: (ids: string[]) => void; recipeEdits?: RecipeEdits; onRecipeEdit?: (id: string, locale: Locale, edit: RecipeTextOverride) => void; onRecipeReset?: (id: string, locale: Locale) => void; initialFocusRecipeId?: string | null; onFocusRecipeChange?: (id: string | null) => void }) {
  const { locale, t } = useLocale();
  const [localFilter, setLocalFilter] = useState<RecipeFilter>("all");
  const filter = activeFilter ?? localFilter;
  const [search, setSearch] = useState("");
  const [localFavoriteIds, setLocalFavoriteIds] = useState<string[]>(loadFavoriteIds);
  const [localRecipeEdits, setLocalRecipeEdits] = useState<RecipeEdits>({});
  const [focusedRecipeId, setFocusedRecipeId] = useState<string | null>(null);
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [editingLocale, setEditingLocale] = useState<Locale | null>(null);
  const [draft, setDraft] = useState<RecipeTextOverride | null>(null);
  const [editStatus, setEditStatus] = useState<"idle" | "saving" | "saved" | "invalid">("idle");
  const editCallbackRef = useRef(onRecipeEdit);
  const editingOriginal = useRef<RecipeTextOverride | null>(null);
  const editingHadOverride = useRef(false);
  const [focusMotion, setFocusMotion] = useState<{ x: number; y: number; scale: number; height: number } | null>(null);
  const previousScrollY = useRef(0);
  const returnFocusTarget = useRef<HTMLElement | null>(null);
  const favoriteIds = controlledFavoriteIds ?? localFavoriteIds;
  const recipeEdits = controlledRecipeEdits ?? localRecipeEdits;
  editCallbackRef.current = onRecipeEdit;
  const normalizedSearch = normalizeSearch(search);
  const line = system === "vertuo" ? "Vertuo" : "Original";
  const systemRecipes = allRecipes.filter((recipe) => recipe.line === line);
  const systemFavoriteCount = systemRecipes.filter((recipe) => favoriteIds.includes(recipe.id)).length;
  const visibleRecipes = systemRecipes
    .filter((recipe) => filter === "all"
      || (filter === "favorites" ? favoriteIds.includes(recipe.id) : recipe.temperature === filter))
    .filter((recipe) => (["en", "ru", "fr"] as const).some((searchLocale) => {
      const translatedRecipe = localizeRecipe(recipe, searchLocale);
      const title = recipeEdits[recipe.id]?.[searchLocale]?.title ?? translatedRecipe.title;
      return normalizeSearch(title).includes(normalizedSearch)
        || normalizeSearch(translatedRecipe.capsule).includes(normalizedSearch);
    }));

  function selectFilter(nextFilter: RecipeFilter) {
    if (onFilterChange) onFilterChange(nextFilter);
    else setLocalFilter(nextFilter);
  }

  function commitRecipeEdit(recipeId: string, editLocale: Locale, edit: RecipeTextOverride) {
    if (onRecipeEdit) onRecipeEdit(recipeId, editLocale, edit);
    else setLocalRecipeEdits((current) => ({ ...current, [recipeId]: { ...current[recipeId], [editLocale]: edit } }));
  }

  function beginRecipeEdit(recipeId: string, recipe: RecipeTextOverride) {
    editingOriginal.current = normalizeRecipeDraft(recipe);
    editingHadOverride.current = Boolean(recipeEdits[recipeId]?.[locale]);
    setEditingRecipeId(recipeId);
    setEditingLocale(locale);
    setDraft({ title: recipe.title, ingredients: [...recipe.ingredients], steps: [...recipe.steps] });
    setEditStatus("saved");
  }

  function finishRecipeEdit(event?: FormEvent) {
    event?.preventDefault();
    if (editingRecipeId && editingLocale && draft && isValidRecipeDraft(draft)) {
      if (!sameRecipeDraft(draft, editingOriginal.current)) commitRecipeEdit(editingRecipeId, editingLocale, normalizeRecipeDraft(draft));
      setEditingRecipeId(null);
      setEditingLocale(null);
      setDraft(null);
      setEditStatus("idle");
    }
  }

  function cancelRecipeEdit() {
    if (!editingRecipeId || !editingLocale || !draft) return;
    const changed = !sameRecipeDraft(draft, editingOriginal.current);
    if (changed && !window.confirm(t("discardRecipeEditConfirm"))) return;
    if (changed) {
      if (editingHadOverride.current) commitRecipeEdit(editingRecipeId, editingLocale, editingOriginal.current!);
      else if (onRecipeReset) onRecipeReset(editingRecipeId, editingLocale);
      else setLocalRecipeEdits((current) => {
        const locales = { ...current[editingRecipeId] };
        delete locales[editingLocale];
        const next = { ...current };
        if (Object.keys(locales).length) next[editingRecipeId] = locales;
        else delete next[editingRecipeId];
        return next;
      });
    }
    setEditingRecipeId(null);
    setEditingLocale(null);
    setDraft(null);
    setEditStatus("idle");
  }

  function resetRecipeEdit(recipeId: string, editLocale: Locale) {
    if (!window.confirm(t("resetRecipeConfirm"))) return;
    if (onRecipeReset) onRecipeReset(recipeId, editLocale);
    else setLocalRecipeEdits((current) => {
      const locales = { ...current[recipeId] };
      delete locales[editLocale];
      const next = { ...current };
      if (Object.keys(locales).length) next[recipeId] = locales;
      else delete next[recipeId];
      return next;
    });
    setEditingRecipeId(null);
    setEditingLocale(null);
    setDraft(null);
    setEditStatus("idle");
  }

  useEffect(() => {
    if (controlledFavoriteIds !== undefined) return;
    try { window.localStorage.setItem(RECIPE_FAVORITES_KEY, JSON.stringify(favoriteIds)); } catch { /* Keep in-memory favorites usable. */ }
  }, [favoriteIds, controlledFavoriteIds]);

  useEffect(() => {
    if (controlledRecipeEdits === undefined || !onRecipeReset) return;
    for (const [recipeId, locales] of Object.entries(controlledRecipeEdits)) {
      const source = allRecipes.find(({ id }) => id === recipeId);
      if (!source) continue;
      for (const localeKey of ["en", "ru", "fr"] as const) {
        const edit = locales?.[localeKey];
        if (edit && sameRecipeDraft(edit, localizeRecipe(source, localeKey))) onRecipeReset(recipeId, localeKey);
      }
    }
  }, [controlledRecipeEdits, onRecipeReset]);

  useEffect(() => {
    if (!editingRecipeId || !editingLocale || !draft) return;
    if (!isValidRecipeDraft(draft)) {
      setEditStatus("invalid");
      return;
    }
    if (sameRecipeDraft(draft, editingOriginal.current)) {
      setEditStatus("saved");
      return;
    }
    setEditStatus("saving");
    const timeout = window.setTimeout(() => {
      const normalized = normalizeRecipeDraft(draft);
      if (editCallbackRef.current) editCallbackRef.current(editingRecipeId, editingLocale, normalized);
      else setLocalRecipeEdits((current) => ({ ...current, [editingRecipeId]: { ...current[editingRecipeId], [editingLocale]: normalized } }));
      setEditStatus("saved");
    }, 800);
    return () => window.clearTimeout(timeout);
  }, [editingRecipeId, editingLocale, draft]);

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
    if (editingRecipeId && draft && !isValidRecipeDraft(draft) && !window.confirm(t("discardInvalidRecipeEdit"))) return;
    if (editingRecipeId && editingLocale && draft && isValidRecipeDraft(draft) && !sameRecipeDraft(draft, editingOriginal.current)) {
      commitRecipeEdit(editingRecipeId, editingLocale, normalizeRecipeDraft(draft));
    }
    setEditingRecipeId(null);
    setEditingLocale(null);
    setDraft(null);
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
          const localized = localizeRecipe(item, locale);
          const savedEdit = recipeEdits[item.id]?.[locale];
          const currentEdit = savedEdit && !sameRecipeDraft(savedEdit, localized) ? savedEdit : undefined;
          const recipe = currentEdit ? { ...localized, ...currentEdit } : localized;
          const isFavorite = favoriteIds.includes(recipe.id);
          const isEditing = editingRecipeId === recipe.id && editingLocale === locale && draft !== null;
          const useZoomedOutPhoto = recipe.id.startsWith("vertuo-us-") || recipe.id === "vertuo-almond-coffee" || recipe.id === "vertuo-gourmandise-coffee";
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
            <div
              className={`recipe-card__photo${recipe.sourcePage ? " recipe-card__photo--book" : ""}${useZoomedOutPhoto ? " recipe-card__photo--zoomed-out" : ""}${focusedRecipeId === recipe.id ? " recipe-card__photo--focused" : ""}${isEditing ? " recipe-card__photo--editing" : ""}`}
              style={useZoomedOutPhoto ? { "--recipe-photo": `url("${recipe.imageUrl}")` } as CSSProperties : undefined}
            >
              <RecipeImage src={recipe.imageUrl} alt={recipe.imageAlt} unavailableLabel={t("recipeImageUnavailable")} />
            </div>
            <div className="recipe-card__meta">
              <span>{recipe.line}</span>
              <span>{recipe.time}</span>
              <span>{recipe.difficulty}</span>
            </div>
            {isEditing && draft ? (
              <form className="recipe-editor" onSubmit={finishRecipeEdit}>
                <label>{t("recipeTitleLabel")}<input aria-label={t("recipeTitleLabel")} maxLength={120} onChange={(event) => setDraft({ ...draft, title: event.target.value })} value={draft.title} /></label>
                <RecipeLineEditor
                  addLabel={t("addIngredient")}
                  fieldLabel={t("ingredients")}
                  items={draft.ingredients}
                  onAdd={() => setDraft({ ...draft, ingredients: [...draft.ingredients, ""] })}
                  onChange={(index, value) => setDraft({ ...draft, ingredients: draft.ingredients.map((line, lineIndex) => lineIndex === index ? value : line) })}
                  onMove={(index, offset) => setDraft({ ...draft, ingredients: moveRecipeLine(draft.ingredients, index, offset) })}
                  onRemove={(index) => setDraft({ ...draft, ingredients: draft.ingredients.filter((_, lineIndex) => lineIndex !== index) })}
                  positionLabel={(position) => t("recipeLinePosition", { position })}
                  removeLabel={(position) => t("removeRecipeLine", { position })}
                  moveUpLabel={(position) => t("moveRecipeLineUp", { position })}
                  moveDownLabel={(position) => t("moveRecipeLineDown", { position })}
                  placeholder={t("ingredientPlaceholder")}
                />
                <RecipeLineEditor
                  addLabel={t("addStep")}
                  fieldLabel={t("preparation")}
                  items={draft.steps}
                  onAdd={() => setDraft({ ...draft, steps: [...draft.steps, ""] })}
                  onChange={(index, value) => setDraft({ ...draft, steps: draft.steps.map((line, lineIndex) => lineIndex === index ? value : line) })}
                  onMove={(index, offset) => setDraft({ ...draft, steps: moveRecipeLine(draft.steps, index, offset) })}
                  onRemove={(index) => setDraft({ ...draft, steps: draft.steps.filter((_, lineIndex) => lineIndex !== index) })}
                  positionLabel={(position) => t("recipeLinePosition", { position })}
                  removeLabel={(position) => t("removeRecipeLine", { position })}
                  moveUpLabel={(position) => t("moveRecipeLineUp", { position })}
                  moveDownLabel={(position) => t("moveRecipeLineDown", { position })}
                  placeholder={t("stepPlaceholder")}
                />
                <p className="recipe-editor__hint">{t("recipeEditLanguageHint")} {t("recipeEditAutoSave")}</p>
                <div aria-live="polite" className="recipe-editor__footer">
                  <span className={`recipe-editor__status recipe-editor__status--${editStatus}`}>{t(editStatus === "saving" ? "recipeEditSaving" : editStatus === "invalid" ? "recipeEditInvalid" : "recipeEditSaved")}</span>
                  <div>
                    {currentEdit && <button className="recipe-editor__reset" onClick={() => resetRecipeEdit(recipe.id, locale)} type="button">{t("resetRecipe")}</button>}
                    <button className="recipe-editor__cancel" onClick={cancelRecipeEdit} type="button">{t("cancelEditing")}</button>
                    <button className="recipe-editor__done" disabled={!isValidRecipeDraft(draft)} type="submit">{t("saveRecipeChanges")}</button>
                  </div>
                </div>
              </form>
            ) : <>
            <h3>{recipe.title}</h3>
            <p className="recipe-card__capsule">{t("capsuleLabel")} <strong>{recipe.capsule}</strong></p>
            {currentEdit && <p className="recipe-card__edited-note">{t("recipeEditedForLanguage", { language: t(locale === "en" ? "englishName" : locale === "ru" ? "russianName" : "frenchName") })}</p>}
            {recipe.adaptationNote && <p className="recipe-card__adaptation">{recipe.adaptationNote}</p>}

            <div className={`recipe-card__body${focusedRecipeId === recipe.id ? " recipe-card__body--vertical" : ""}`}>
              <div>
                <h4>{t("ingredients")}</h4>
                <ul aria-label={t("ingredients")}>
                  {recipe.ingredients.map((ingredient) => <li key={ingredient}>{ingredient}</li>)}
                </ul>
              </div>
              <div className="recipe-card__method">
                <button aria-label={t("editRecipe", { name: recipe.title })} className="recipe-edit-button" onClick={(event) => {
                  if (focusedRecipeId !== recipe.id) {
                    const card = event.currentTarget.closest("article");
                    if (card instanceof HTMLElement) openFocusedRecipe(recipe.id, card);
                  }
                  beginRecipeEdit(recipe.id, { title: recipe.title, ingredients: recipe.ingredients, steps: recipe.steps });
                }} title={t("editRecipeAction")} type="button"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.359a.5.5 0 0 0 .623.622l4.36-1.32a2 2 0 0 0 .829-.5z" /><path d="m15 5 4 4" /></svg></button>
                <h4>{t("preparation")}</h4>
                <ol aria-label={t("preparation")}>
                  {recipe.steps.map((step) => <li key={step}>{step}</li>)}
                </ol>
              </div>
            </div>

            <a className="recipe-card__source" href={recipe.sourceUrl} rel="noreferrer" target="_blank">
              {recipe.sourceLabel} <span aria-hidden="true">↗</span>
            </a>
            </>}
          </article>
          </Fragment>
          );
        })}
      </div>
    </section>
  );
}

function RecipeLineEditor({ fieldLabel, addLabel, items, placeholder, positionLabel, removeLabel, moveUpLabel, moveDownLabel, onChange, onAdd, onRemove, onMove }: {
  fieldLabel: string;
  addLabel: string;
  items: string[];
  placeholder: string;
  positionLabel: (position: number) => string;
  removeLabel: (position: number) => string;
  moveUpLabel: (position: number) => string;
  moveDownLabel: (position: number) => string;
  onChange: (index: number, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onMove: (index: number, offset: -1 | 1) => void;
}) {
  return (
    <fieldset className="recipe-editor__group">
      <legend>{fieldLabel}</legend>
      <div className="recipe-editor__list">
        {items.map((item, index) => {
          const position = index + 1;
          return <div className="recipe-editor__line" key={`${fieldLabel}-${position}`}>
            <label className="visually-hidden" htmlFor={`recipe-line-${fieldLabel}-${position}`}>{positionLabel(position)}</label>
            <textarea id={`recipe-line-${fieldLabel}-${position}`} aria-label={positionLabel(position)} maxLength={240} onChange={(event) => onChange(index, event.target.value)} placeholder={placeholder} rows={2} value={item} />
            <div className="recipe-editor__line-actions">
              <button aria-label={moveUpLabel(position)} disabled={index === 0} onClick={() => onMove(index, -1)} type="button">↑</button>
              <button aria-label={moveDownLabel(position)} disabled={index === items.length - 1} onClick={() => onMove(index, 1)} type="button">↓</button>
              <button aria-label={removeLabel(position)} onClick={() => onRemove(index)} type="button">×</button>
            </div>
          </div>;
        })}
      </div>
      <button className="recipe-editor__add" disabled={items.length >= 30} onClick={onAdd} type="button">+ {addLabel}</button>
    </fieldset>
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

function normalizeRecipeDraft(draft: RecipeTextOverride): RecipeTextOverride {
  return {
    title: draft.title.trim(),
    ingredients: draft.ingredients.map((line) => line.trim()).filter(Boolean).slice(0, 30).map((line) => line.slice(0, 240)),
    steps: draft.steps.map((line) => line.trim()).filter(Boolean).slice(0, 30).map((line) => line.slice(0, 240)),
  };
}

function isValidRecipeDraft(draft: RecipeTextOverride): boolean {
  return draft.title.trim().length > 0
    && draft.title.trim().length <= 120
    && draft.ingredients.length <= 30
    && draft.steps.length <= 30
    && draft.ingredients.some((line) => line.trim().length > 0)
    && draft.steps.some((line) => line.trim().length > 0)
    && [...draft.ingredients, ...draft.steps].every((line) => line.length <= 240);
}

function sameRecipeDraft(left: RecipeTextOverride, right: RecipeTextOverride | null): boolean {
  return right !== null && JSON.stringify(normalizeRecipeDraft(left)) === JSON.stringify(normalizeRecipeDraft(right));
}
