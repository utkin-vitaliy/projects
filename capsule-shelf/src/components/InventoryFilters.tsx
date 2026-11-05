import type { InventoryFilter } from "../features/inventory/useInventory";
import type { CategoryFilter } from "../features/inventory/useInventory";
import type { Capsule } from "../domain/capsules";
import { useLocale } from "../i18n/locale";

type Props = {
  value: InventoryFilter;
  onChange: (filter: InventoryFilter) => void;
  category: CategoryFilter;
  onCategoryChange: (category: CategoryFilter) => void;
  search: string;
  onSearchChange: (value: string) => void;
  catalog: Capsule[];
};

const categoryKeys = ["limited", "italian", "decaffeinated", "world", "origins", "flavoured", "heritage"] as const;

export function InventoryFilters({ value, onChange, category, onCategoryChange, search, onSearchChange, catalog }: Props) {
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
      <label className="search-field search-field--capsules">
        <svg aria-hidden="true" viewBox="0 0 20 20"><circle cx="8.8" cy="8.8" r="5.8"/><path d="m13.2 13.2 4 4"/></svg>
        <input aria-label={t("searchCapsules")} onChange={(event) => onSearchChange(event.target.value)} placeholder={t("searchCapsules")} type="search" value={search} />
      </label>
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
          </button>
        ))}
      </div>
      <label className="category-filter">
        <span>{t("category")}</span>
        <select aria-label={t("categoryAria")} onChange={(event) => onCategoryChange(event.target.value as CategoryFilter)} value={category}>
          <option value="all">{t("allCategories")}</option>
          {categories.map((itemCategory) => <option key={itemCategory} value={itemCategory}>{t(itemCategory === "heritage" ? "classic" : itemCategory)}</option>)}
        </select>
      </label>
    </div>
  );
}
