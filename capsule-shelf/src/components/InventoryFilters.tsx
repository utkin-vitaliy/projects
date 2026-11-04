import type { InventoryFilter } from "../features/inventory/useInventory";
import type { CategoryFilter } from "../features/inventory/useInventory";
import { capsules } from "../data/capsules";
import { useLocale } from "../i18n/locale";

type Props = {
  value: InventoryFilter;
  onChange: (filter: InventoryFilter) => void;
  category: CategoryFilter;
  onCategoryChange: (category: CategoryFilter) => void;
};

const categoryKeys = ["limited", "italian", "decaffeinated", "world", "origins", "flavoured", "heritage"] as const;

export function InventoryFilters({ value, onChange, category, onCategoryChange }: Props) {
  const { t } = useLocale();
  const filters = [
    { id: "all" as const, label: t("allVarieties") },
    { id: "favorites" as const, label: t("favorites") },
    { id: "low" as const, label: t("restock") },
  ];
  const populatedCategories = new Set(capsules.map(({ category: itemCategory }) => itemCategory));
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
