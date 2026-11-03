import { useState } from "react";
import type { CapsuleNote, CapsuleRating } from "../domain/capsules";

type Props = {
  capsuleName: string;
  note: CapsuleNote;
  onSave: (note: CapsuleNote) => void;
};

const ratings: { value: Exclude<CapsuleRating, null>; label: string }[] = [
  { value: "like", label: "Нравится" },
  { value: "neutral", label: "Нейтрально" },
  { value: "dislike", label: "Не нравится" },
];

export function CapsuleNotes({ capsuleName, note, onSave }: Props) {
  const [draft, setDraft] = useState<CapsuleNote>(note);
  const [saved, setSaved] = useState(false);

  function update<K extends keyof CapsuleNote>(key: K, value: CapsuleNote[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  function save() {
    onSave(draft);
    setSaved(true);
  }

  return (
    <div className="notes-editor">
      <div className="notes-rating" role="group" aria-label={`Оценка ${capsuleName}`}>
        <span className="notes-label">Твоё впечатление</span>
        <div className="rating-options">
          {ratings.map((rating) => (
            <button
              aria-pressed={draft.rating === rating.value}
              className={`rating-option${draft.rating === rating.value ? " is-selected" : ""}`}
              key={rating.value}
              onClick={() => update("rating", rating.value)}
              type="button"
            >
              {rating.label}
            </button>
          ))}
        </div>
      </div>
      <label className="notes-field">
        <span>Вкус по твоим ощущениям</span>
        <textarea
          aria-label="Личная заметка о вкусе"
          onChange={(event) => update("tastingNotes", event.target.value)}
          placeholder="Например: мягкий, с шоколадным послевкусием"
          rows={2}
          value={draft.tastingNotes}
        />
      </label>
      <label className="notes-field">
        <span>Рецепты</span>
        <textarea aria-label="Рецепты" onChange={(event) => update("recipes", event.target.value)} placeholder="Капучино, айс-латте…" rows={2} value={draft.recipes} />
      </label>
      <div className="notes-field-grid">
        <label className="notes-field">
          <span>Подходит для</span>
          <textarea aria-label="Подходит для" onChange={(event) => update("suitableFor", event.target.value)} placeholder="Эспрессо, напитков с молоком…" rows={2} value={draft.suitableFor} />
        </label>
        <label className="notes-field">
          <span>Не подходит для</span>
          <textarea aria-label="Не подходит для" onChange={(event) => update("unsuitableFor", event.target.value)} placeholder="Длинного лунго, если любишь покрепче…" rows={2} value={draft.unsuitableFor} />
        </label>
      </div>
      <div className="notes-footer">
        {saved && <span className="notes-saved" role="status">Заметки сохранены</span>}
        <button className="save-notes-button" onClick={save} type="button">Сохранить заметки {capsuleName}</button>
      </div>
    </div>
  );
}
