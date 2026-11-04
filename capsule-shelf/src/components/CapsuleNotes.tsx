import { useState } from "react";
import type { CapsuleNote, CapsuleRating } from "../domain/capsules";
import { useLocale } from "../i18n/locale";

type Props = {
  capsuleName: string;
  note: CapsuleNote;
  onSave: (note: CapsuleNote) => void;
};

const ratings: { value: Exclude<CapsuleRating, null>; key: "like" | "neutral" | "dislike" }[] = [
  { value: "like", key: "like" }, { value: "neutral", key: "neutral" }, { value: "dislike", key: "dislike" },
];

export function CapsuleNotes({ capsuleName, note, onSave }: Props) {
  const { t } = useLocale();
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
      <div className="notes-rating" role="group" aria-label={t("notesAria", { name: capsuleName })}>
        <span className="notes-label">{t("impression")}</span>
        <div className="rating-options">
          {ratings.map((rating) => (
            <button
              aria-pressed={draft.rating === rating.value}
              className={`rating-option${draft.rating === rating.value ? " is-selected" : ""}`}
              key={rating.value}
              onClick={() => update("rating", rating.value)}
              type="button"
            >
              {t(rating.key)}
            </button>
          ))}
        </div>
      </div>
      <label className="notes-field">
        <span>{t("tastingNotes")}</span>
        <textarea
          aria-label={t("tastingInputLabel")}
          onChange={(event) => update("tastingNotes", event.target.value)}
          placeholder={t("tastingPlaceholder")}
          rows={2}
          value={draft.tastingNotes}
        />
      </label>
      <label className="notes-field">
        <span>{t("recipesLabel")}</span>
        <textarea aria-label={t("recipesLabel")} onChange={(event) => update("recipes", event.target.value)} placeholder={t("recipesPlaceholder")} rows={2} value={draft.recipes} />
      </label>
      <div className="notes-field-grid">
        <label className="notes-field">
          <span>{t("suitableFor")}</span>
          <textarea aria-label={t("suitableFor")} onChange={(event) => update("suitableFor", event.target.value)} placeholder={t("suitablePlaceholder")} rows={2} value={draft.suitableFor} />
        </label>
        <label className="notes-field">
          <span>{t("unsuitableFor")}</span>
          <textarea aria-label={t("unsuitableFor")} onChange={(event) => update("unsuitableFor", event.target.value)} placeholder={t("unsuitablePlaceholder")} rows={2} value={draft.unsuitableFor} />
        </label>
      </div>
      <div className="notes-footer">
        {saved && <span className="notes-saved" role="status">{t("notesSaved")}</span>}
        <button className="save-notes-button" onClick={save} type="button">{t("saveNotes", { name: capsuleName })}</button>
      </div>
    </div>
  );
}
