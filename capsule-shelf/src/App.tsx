import { CapsuleGrid } from "./components/CapsuleGrid";
import { InventoryFilters } from "./components/InventoryFilters";
import { InventorySummary } from "./components/InventorySummary";
import { capsules as fullCatalog } from "./data/capsules";
import { useInventory } from "./features/inventory/useInventory";

export default function App() {
  const {
    capsules,
    inventory,
    filter,
    setFilter,
    categoryFilter,
    setCategoryFilter,
    lowStockIds,
    totalCapsules,
    storageNotice,
    ready,
    changeQuantity,
    toggleFavorite,
    updateThreshold,
    saveNote,
  } = useInventory();

  return (
    <main aria-busy={!ready} className="page-shell">
      <header className="page-header">
        <div className="brand-mark" aria-hidden="true"><span /></div>
        <div className="page-heading">
          <p className="eyebrow">ТВОЯ КОФЕЙНАЯ КОЛЛЕКЦИЯ</p>
          <h1>Моя кофейная полка</h1>
          <p className="page-intro">Любимые вкусы, свежий запас и заметки — всё на виду.</p>
        </div>
        <div className="line-chip"><span className="line-chip__dot" /> Nespresso Original</div>
      </header>

      {!ready ? (
        <p className="inventory-loading" role="status">Загружаю данные с диска…</p>
      ) : (
        <>
          <InventorySummary
            catalog={fullCatalog}
            inventory={inventory}
            lowStockIds={lowStockIds}
            totalCapsules={totalCapsules}
            varietyCount={fullCatalog.length}
          />

          {storageNotice && <p className="storage-notice" role="alert">{storageNotice}</p>}

          <section className="catalog-section" aria-labelledby="catalog-title">
        <div className="catalog-heading-row">
          <div>
            <p className="eyebrow">ТВОЙ КАТАЛОГ</p>
            <h2 id="catalog-title">Сорта кофе <span>{fullCatalog.length}</span></h2>
          </div>
          <p className="catalog-hint">Введи количество капсул для каждого вкуса</p>
        </div>
        <InventoryFilters category={categoryFilter} onCategoryChange={setCategoryFilter} onChange={setFilter} value={filter} />
        <CapsuleGrid
          catalog={capsules}
          inventory={inventory}
          lowStockIds={lowStockIds}
          onFavoriteToggle={toggleFavorite}
          onNoteSave={saveNote}
          onQuantitySet={changeQuantity}
          onThresholdChange={updateThreshold}
        />
          </section>
        </>
      )}

      <footer className="page-footer">
        <span>Твои данные хранятся в JSON-файле на этом компьютере</span>
        <a href="https://www.nespresso.com/ca/en/order/capsules/original" rel="noreferrer" target="_blank">Каталог Nespresso Canada ↗</a>
      </footer>
    </main>
  );
}
