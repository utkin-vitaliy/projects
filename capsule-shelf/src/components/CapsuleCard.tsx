import { useEffect, useState } from "react";
import { CapsuleNotes } from "./CapsuleNotes";
import { createEmptyInventoryEntry, type Capsule, type CapsuleNote, type InventoryEntry } from "../domain/capsules";

type Props = {
  capsule: Capsule;
  entry?: InventoryEntry;
  lowStock: boolean;
  onQuantitySet: (capsuleId: string, quantity: number) => void;
  onFavoriteToggle: (capsuleId: string) => void;
  onThresholdChange: (capsuleId: string, threshold: number) => void;
  onNoteSave: (capsuleId: string, note: CapsuleNote) => void;
};

function hasNotes(note: CapsuleNote): boolean {
  return note.rating !== null || Boolean(note.tastingNotes || note.recipes || note.suitableFor || note.unsuitableFor);
}

export function CapsuleCard({ capsule, entry = createEmptyInventoryEntry(), lowStock, onQuantitySet, onFavoriteToggle, onThresholdChange, onNoteSave }: Props) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [quantityDraft, setQuantityDraft] = useState(String(entry.quantity));
  useEffect(() => setQuantityDraft(String(entry.quantity)), [entry.quantity]);
  const status = lowStock ? (entry.quantity === 0 ? "Закончился" : "Пора пополнить") : entry.favorite ? "В запасе" : "";
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
          <div className="photo-fallback" role="img" aria-label={`Фото ${capsule.name} временно недоступно`}>
            <span className="fallback-capsule" aria-hidden="true" />
            <span>Фото сорта временно недоступно</span>
          </div>
        )}
        <a className="photo-source" href={capsule.sourceUrl} rel="noreferrer" target="_blank">Источник</a>
        <button
          aria-label={`${entry.favorite ? "Убрать" : "Добавить"} ${capsule.name} в избранное`}
          aria-pressed={entry.favorite}
          className={`favorite-button${entry.favorite ? " is-favorite" : ""}`}
          onClick={() => onFavoriteToggle(capsule.id)}
          title={entry.favorite ? "Убрать из избранного" : "Добавить в избранное"}
          type="button"
        >
          <span aria-hidden="true">{entry.favorite ? "★" : "☆"}</span>
        </button>
      </div>

      <div className="capsule-card__content">
        <div className="capsule-title-row">
          <div>
            <p className="capsule-family">Original · Кофейные капсулы</p>
            <h2>{capsule.name}</h2>
          </div>
          {typeof capsule.intensity === "number" && <span className="intensity-badge" aria-label={`Интенсивность ${capsule.intensity} из 13`}>{capsule.intensity}<small>/13</small></span>}
        </div>
        <p className="capsule-flavor">{capsule.flavor}</p>

        <div className="stock-row">
          <span className="stock-label">В наличии</span>
          <div className="quantity-control" aria-label={`Управление остатком ${capsule.name}`}>
            <button aria-label={`Уменьшить капсулы ${capsule.name}`} disabled={entry.quantity <= 0} onClick={() => onQuantitySet(capsule.id, Math.max(0, entry.quantity - 1))} type="button">−</button>
            <input
              aria-label={`Количество ${capsule.name}`}
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
            <button aria-label={`Добавить капсулу ${capsule.name}`} disabled={entry.quantity >= Number.MAX_SAFE_INTEGER} onClick={() => onQuantitySet(capsule.id, entry.quantity + 1)} type="button">+</button>
          </div>
        </div>
        <div className="capsule-status-row">
          {status ? <span className={`stock-status${lowStock ? " stock-status--low" : ""}`}>{status}</span> : <span className="stock-status-placeholder">&nbsp;</span>}
          {entry.favorite && (
            <label className="threshold-control">
              <span>Напомнить при</span>
              <input
                aria-label={`Порог запаса ${capsule.name}`}
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
          {hasNotes(entry.note) && <span className="note-indicator">Личная заметка добавлена</span>}
          <button
            aria-expanded={notesOpen}
            aria-label={`Заметки ${capsule.name}`}
            className="notes-toggle"
            onClick={() => setNotesOpen((open) => !open)}
            type="button"
          >
            <span>{notesOpen ? "Свернуть заметки" : hasNotes(entry.note) ? "Мои заметки" : "Добавить заметку"}</span>
            <span aria-hidden="true" className="notes-toggle__icon">{notesOpen ? "−" : "+"}</span>
          </button>
        </div>
        {notesOpen && <CapsuleNotes capsuleName={capsule.name} note={entry.note} onSave={(note) => onNoteSave(capsule.id, note)} />}
      </div>
    </article>
  );
}
