import type { InventoryFilter } from "../features/inventory/useInventory";
import type { CategoryFilter } from "../features/inventory/useInventory";
import type { Capsule, CapsuleSort, CapsuleSortMetric } from "../domain/capsules";
import { useLocale, type MessageKey } from "../i18n/locale";

type Props = {
  value: InventoryFilter;
  onChange: (filter: InventoryFilter) => void;
  category: CategoryFilter;
  onCategoryChange: (category: CategoryFilter) => void;
  search: string;
  onSearchChange: (value: string) => void;
  catalog: Capsule[];
  favoriteCount: number;
  lowStockCount: number;
  sort: CapsuleSort;
  onSortChange: (sort: CapsuleSort) => void;
};

const categoryKeys = ["limited", "italian", "decaffeinated", "world", "origins", "flavoured", "heritage"] as const;
const sortableMetrics: [CapsuleSortMetric, MessageKey, MessageKey][] = [
  ["intensity", "intensityLowToHigh", "intensityHighToLow"],
  ["caffeine", "caffeineLowToHigh", "caffeineHighToLow"],
  ["bitterness", "bitternessLowToHigh", "bitternessHighToLow"],
  ["acidity", "acidityLowToHigh", "acidityHighToLow"],
  ["body", "bodyLowToHigh", "bodyHighToLow"],
  ["roasting", "roastingLowToHigh", "roastingHighToLow"],
  ["coffeeGrams", "coffeeGramsLowToHigh", "coffeeGramsHighToLow"],
];

export function InventoryFilters({ value, onChange, category, onCategoryChange, search, onSearchChange, catalog, favoriteCount, lowStockCount, sort, onSortChange }: Props) {
  const { t } = useLocale();
  const filters = [
    { id: "all" as const, label: t("allVarieties") },
    { id: "favorites" as const, label: t("favorites") },
    { id: "low" as const, label: t("restock") },
  ];
  const populatedCategories = new Set(catalog.map(({ category: itemCategory }) => itemCategory));
  const categories = categoryKeys.filter((itemCategory) => populatedCategories.has(itemCategory));
  return (
    <div className="filter-controls">
      <div className="filter-tabs" role="group" aria-label={t("filterAria")}>
        {filters.map((filter) => (
          <button
            aria-pressed={value === filter.id}
            className={`filter-tab${value === filter.id ? " is-active" : ""}`}
            key={filter.id}
            onClick={() => onChange(filter.id)}
            type="button"
          >
            {filter.label}
            {filter.id === "all" && <span aria-hidden="true" className="filter-tab__count">{catalog.length}</span>}
            {filter.id === "favorites" && <span aria-hidden="true" className="filter-tab__count">{favoriteCount}</span>}
            {filter.id === "low" && <span aria-hidden="true" className="filter-tab__count">{lowStockCount}</span>}
          </button>
        ))}
      </div>
      <label className="search-field search-field--capsules">
        <svg aria-hidden="true" viewBox="0 0 20 20"><circle cx="8.8" cy="8.8" r="5.8"/><path d="m13.2 13.2 4 4"/></svg>
        <input aria-label={t("searchCapsules")} onChange={(event) => onSearchChange(event.target.value)} placeholder={t("searchCapsules")} type="search" value={search} />
      </label>
      <div className="capsule-filter-selects">
        <label className="category-filter">
          <span>{t("category")}</span>
          <select aria-label={t("categoryAria")} onChange={(event) => onCategoryChange(event.target.value as CategoryFilter)} value={category}>
            <option value="all">{t("allCategories")}</option>
            {categories.map((itemCategory) => <option key={itemCategory} value={itemCategory}>{t(itemCategory === "heritage" ? "classic" : itemCategory)}</option>)}
          </select>
        </label>
        <label className="sort-filter">
          <span>{t("sortBy")}</span>
          <select aria-label={t("sortCapsulesAria")} onChange={(event) => onSortChange(event.target.value as CapsuleSort)} value={sort}>
            <option value="catalog">{t("sortCatalog")}</option>
            {sortableMetrics.map(([metric, lowToHigh, highToLow]) => (
              <optgroup key={metric} label={t(metric === "coffeeGrams" ? "coffeeAmount" : metric === "intensity" ? "intensityLabel" : metric)}>
                <option value={`${metric}-asc`}>{t(lowToHigh)}</option>
                <option value={`${metric}-desc`}>{t(highToLow)}</option>
              </optgroup>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
