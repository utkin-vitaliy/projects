import type { Capsule, InventoryState } from "../domain/capsules";

type Props = {
  totalCapsules: number;
  varietyCount: number;
  lowStockIds: string[];
  catalog: Capsule[];
  inventory: InventoryState;
};

export function InventorySummary({ totalCapsules, varietyCount, lowStockIds, catalog, inventory }: Props) {
  return (
    <section className="summary-panel" aria-label="Сводка запасов">
      <div className="summary-lead">
        <span className="summary-label">Всего капсул</span>
        <strong className="summary-total" aria-label="Всего капсул">{totalCapsules}</strong>
        <span className="summary-caption">в твоей коллекции</span>
      </div>
      <div className="summary-detail">
        <div className="summary-stat">
          <span className="summary-stat__number">{varietyCount}</span>
          <span>сортов в каталоге</span>
        </div>
        <div className="summary-stat summary-stat--alert">
          <span className="summary-stat__number" aria-label="Сорта, которым пора пополнить запас">{lowStockIds.length}</span>
          <span>пора пополнить</span>
        </div>
      </div>
      {lowStockIds.length > 0 && (
        <div className="summary-alert" role="status">
          <span className="summary-alert__icon" aria-hidden="true">!</span>
          <div>
            <strong>Любимые сорта заканчиваются</strong>
            <ul>
              {lowStockIds.map((id) => {
                const capsule = catalog.find((item) => item.id === id);
                if (!capsule) return null;
                return <li key={id}>{capsule.name} — осталось {inventory[id]?.quantity ?? 0}</li>;
              })}
            </ul>
          </div>
        </div>
      )}
      {lowStockIds.length === 0 && (
        <div className="summary-tip" role="note">
          <span className="summary-tip__mark" aria-hidden="true">✦</span>
          <div>
            <strong>Пока всё спокойно</strong>
            <p>Отметь любимый сорт — и запас будет под контролем.</p>
          </div>
        </div>
      )}
    </section>
  );
}
