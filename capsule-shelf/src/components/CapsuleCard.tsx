import { lazy, Suspense, useEffect, useState } from "react";
import { CapsuleNotes } from "./CapsuleNotes";
import { createEmptyInventoryEntry, type Capsule, type CapsuleCupSize, type CapsuleNote, type InventoryEntry } from "../domain/capsules";
import { getRecipeIdsForCapsule } from "../data/recipeIndex";
import { useLocale, type MessageKey } from "../i18n/locale";

const RecipeLinks = lazy(() => import("./RecipeLinks").then(({ RecipeLinks: Component }) => ({ default: Component })));

type Props = {
  capsule: Capsule;
  entry?: InventoryEntry;
  lowStock: boolean;
  onQuantitySet: (capsuleId: string, quantity: number) => void;
  onFavoriteToggle: (capsuleId: string) => void;
  onThresholdChange: (capsuleId: string, threshold: number) => void;
  onNoteSave: (capsuleId: string, note: CapsuleNote) => void;
  onRecipeSelect: (recipeId: string) => void;
};

function hasNotes(note: CapsuleNote): boolean {
  return note.rating !== null || Boolean(note.tastingNotes || note.recipes || note.suitableFor || note.unsuitableFor);
}

const cupSizeMessage: Record<CapsuleCupSize, MessageKey> = {
  ristretto: "cupSizeRistretto",
  espresso: "cupSizeEspresso",
  doubleEspresso: "cupSizeDoubleEspresso",
  granLungo: "cupSizeGranLungo",
  coffee: "cupSizeCoffee",
  alto: "cupSizeAlto",
};

export function CapsuleCard({ capsule, entry = createEmptyInventoryEntry(), lowStock, onQuantitySet, onFavoriteToggle, onThresholdChange, onNoteSave, onRecipeSelect }: Props) {
  const { t } = useLocale();
  const [notesOpen, setNotesOpen] = useState(false);
  const [recipesOpen, setRecipesOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [quantityDraft, setQuantityDraft] = useState(String(entry.quantity));
  const recipeIds = getRecipeIdsForCapsule(capsule.id, capsule.system ?? "original");
  useEffect(() => setQuantityDraft(String(entry.quantity)), [entry.quantity]);
  const status = lowStock ? (entry.quantity === 0 ? t("finished") : t("restock")) : entry.favorite ? t("inStock") : "";
  function commitQuantity() {
    const nextQuantity = Number(quantityDraft);
    if (quantityDraft.trim() !== "" && Number.isSafeInteger(nextQuantity) && nextQuantity >= 0) {
      onQuantitySet(capsule.id, nextQuantity);
    } else {
      setQuantityDraft(String(entry.quantity));
    }
  }

  return (
    <article className={`capsule-card${lowStock ? " capsule-card--low" : ""}`}>
      <div className="capsule-photo">
        {!imageFailed ? (
          <img
            alt={capsule.name}
            className={capsule.imageFit === "contain" ? "capsule-image capsule-image--contain" : "capsule-image"}
            loading="lazy"
            onError={() => setImageFailed(true)}
            referrerPolicy="no-referrer"
            src={capsule.imageUrl}
          />
        ) : (
          <div className="photo-fallback" role="img" aria-label={`${capsule.name}: ${t("imageUnavailable")}`}>
            <span className="fallback-capsule" aria-hidden="true" />
            <span>{t("imageUnavailable")}</span>
          </div>
        )}
        <a aria-label={t("sourceLink", { name: capsule.name })} className="photo-source" href={capsule.sourceUrl} rel="noreferrer" target="_blank" title={t("sourceTitle")}>
          <svg aria-hidden="true" viewBox="0 0 16 16"><path d="M9 3h4v4M13 3 7 9" /><path d="M11 9v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h3" /></svg>
        </a>
        <button
          aria-label={entry.favorite ? t("removeFavorite", { name: capsule.name }) : t("addFavorite", { name: capsule.name })}
          aria-pressed={entry.favorite}
          className={`favorite-button${entry.favorite ? " is-favorite" : ""}`}
          onClick={() => onFavoriteToggle(capsule.id)}
          title={entry.favorite ? t("favoriteTitleRemove") : t("favoriteTitleAdd")}
          type="button"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" /></svg>
        </button>
      </div>

      <div className="capsule-card__content">
        <div className="capsule-title-row">
          <div>
            <p className="capsule-family">{capsule.system === "vertuo" ? t("capsuleFamilyVertuo") : t("capsuleFamily")}</p>
            <h2>{capsule.name}</h2>
          </div>
          {typeof capsule.intensity === "number" && <span className="intensity-badge" aria-label={t("intensity", { value: capsule.intensity })}>{capsule.intensity}<small>/13</small></span>}
        </div>
        <p className="capsule-flavor">{capsule.flavor}</p>
        {capsule.cupSize && <p className="capsule-cup-size">{t(cupSizeMessage[capsule.cupSize.type])} · {capsule.cupSize.millilitres} ml</p>}

        {recipeIds.length > 0 && (
          <div className="capsule-recipes">
            <button
              aria-controls={`capsule-recipes-${capsule.id}`}
              aria-expanded={recipesOpen}
              aria-label={t("recipesFor", { name: capsule.name, count: recipeIds.length })}
              className="capsule-recipe-toggle"
              onClick={() => setRecipesOpen((open) => !open)}
              type="button"
            >
              <span>{t("recipeCount")} <span className="capsule-recipe-count">{recipeIds.length}</span></span>
              <span aria-hidden="true" className="disclosure-chevron"><svg viewBox="0 0 16 16"><path d="m4 6 4 4 4-4" /></svg></span>
            </button>
            <div className="capsule-recipe-links" hidden={!recipesOpen} id={`capsule-recipes-${capsule.id}`}>
              {recipesOpen && <Suspense fallback={<span>{t("loading")}</span>}><RecipeLinks capsuleId={capsule.id} onRecipeSelect={onRecipeSelect} /></Suspense>}
            </div>
          </div>
        )}

        <div className="stock-row">
          <span className="stock-label">{t("stock")}</span>
          <div className="quantity-control" aria-label={t("manageStock", { name: capsule.name })}>
            <button aria-label={t("reduceCapsule", { name: capsule.name })} disabled={entry.quantity <= 0} onClick={() => onQuantitySet(capsule.id, Math.max(0, entry.quantity - 1))} type="button">−</button>
            <input
              aria-label={t("quantityLabel", { name: capsule.name })}
              inputMode="numeric"
              max={Number.MAX_SAFE_INTEGER}
              min={0}
              onBlur={commitQuantity}
              onChange={(event) => setQuantityDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  event.currentTarget.blur();
                }
              }}
              step={1}
              type="number"
              value={quantityDraft}
            />
            <button aria-label={t("addCapsule", { name: capsule.name })} disabled={entry.quantity >= Number.MAX_SAFE_INTEGER} onClick={() => onQuantitySet(capsule.id, entry.quantity + 1)} type="button">+</button>
          </div>
        </div>
        <div className="capsule-status-row">
          {status ? <span className={`stock-status${lowStock ? " stock-status--low" : ""}`}>{status}</span> : <span className="stock-status-placeholder">&nbsp;</span>}
          {entry.favorite && (
            <label className="threshold-control">
              <span>{t("remindAt")}</span>
              <input
                aria-label={`${t("thresholdLabel")} ${capsule.name}`}
                min="0"
                onChange={(event) => {
                  const value = event.currentTarget.valueAsNumber;
                  if (Number.isSafeInteger(value) && value >= 0) onThresholdChange(capsule.id, value);
                }}
                step="1"
                type="number"
                value={entry.threshold}
              />
            </label>
          )}
        </div>

        <div className="card-notes-row">
          {hasNotes(entry.note) && <span className="note-indicator">{t("noteAdded")}</span>}
          <button
            aria-expanded={notesOpen}
            aria-label={t("notesButtonLabel", { name: capsule.name })}
            className="notes-toggle"
            onClick={() => setNotesOpen((open) => !open)}
            type="button"
          >
            <span>{notesOpen ? t("collapseNotes") : hasNotes(entry.note) ? t("myNotes") : t("addNote")}</span>
            <span aria-hidden="true" className="disclosure-chevron"><svg viewBox="0 0 16 16"><path d="m4 6 4 4 4-4" /></svg></span>
          </button>
        </div>
        {notesOpen && <CapsuleNotes capsuleName={capsule.name} note={entry.note} onSave={(note) => onNoteSave(capsule.id, note)} />}
      </div>
    </article>
  );
}
