import type { Capsule, InventoryState } from "../domain/capsules";
import { useLocale } from "../i18n/locale";

type Props = {
  totalCapsules: number;
  varietyCount: number;
  lowStockIds: string[];
  catalog: Capsule[];
  inventory: InventoryState;
  onSelectCapsule: (capsuleId: string) => void;
};

export function InventorySummary({ totalCapsules, varietyCount, lowStockIds, catalog, inventory, onSelectCapsule }: Props) {
  const { t } = useLocale();
  return (
    <section className="summary-panel" aria-label={t("summary")}>
      <div className="summary-lead">
        <span className="summary-label">{t("total")}</span>
        <strong className="summary-total" aria-label={t("total")}>{totalCapsules}</strong>
        <span className="summary-caption">{t("collection")}</span>
      </div>
      <div className="summary-detail">
        <div className="summary-stat">
          <span className="summary-stat__number">{varietyCount}</span>
          <span>{t("varieties")}</span>
        </div>
        <div className="summary-stat summary-stat--alert">
          <span className="summary-stat__number" aria-label={t("restockVarieties")}>{lowStockIds.length}</span>
          <span>{t("restockCount")}</span>
        </div>
      </div>
      {lowStockIds.length > 0 && (
        <div className="summary-alert" role="status">
          <span className="summary-alert__icon" aria-hidden="true">!</span>
          <div>
            <strong>{t("favoritesEnding")}</strong>
            <ul>
              {lowStockIds.map((id) => {
                const capsule = catalog.find((item) => item.id === id);
                if (!capsule) return null;
                return <li key={id}>
                  <a className="summary-alert__capsule-link" href="#capsules" onClick={(event) => { event.preventDefault(); onSelectCapsule(id); }}>{capsule.name}</a>
                  {t("capsulesLeft", { count: inventory[id]?.quantity ?? 0 })}
                </li>;
              })}
            </ul>
          </div>
        </div>
      )}
      {lowStockIds.length === 0 && (
        <div className="summary-tip" role="note">
          <span className="summary-tip__mark" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="m8.5 12.2 2.3 2.3 4.8-5" /></svg></span>
          <div>
            <strong>{t("allCalm")}</strong>
            <p>{t("calmTip")}</p>
          </div>
        </div>
      )}
    </section>
  );
}
