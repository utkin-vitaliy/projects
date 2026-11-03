import type { InventoryFilter } from "../features/inventory/useInventory";
import type { CategoryFilter } from "../features/inventory/useInventory";
import { capsules } from "../data/capsules";

type Props = {
  value: InventoryFilter;
  onChange: (filter: InventoryFilter) => void;
  category: CategoryFilter;
  onCategoryChange: (category: CategoryFilter) => void;
};

const filters: { id: InventoryFilter; label: string }[] = [
  { id: "all", label: "Все сорта" },
  { id: "favorites", label: "Избранное" },
  { id: "low", label: "Пора пополнить" },
];

const categoryLabels = {
  limited: "Лимитированные",
  italian: "Итальянские",
  decaffeinated: "Без кофеина",
  world: "Кофейные культуры мира",
  origins: "Кофе по происхождению",
  flavoured: "Ароматизированные",
  heritage: "Классика",
} as const;

export function InventoryFilters({ value, onChange, category, onCategoryChange }: Props) {
  const populatedCategories = new Set(capsules.map(({ category: itemCategory }) => itemCategory));
  const categories = (Object.keys(categoryLabels) as (keyof typeof categoryLabels)[]).filter((itemCategory) => populatedCategories.has(itemCategory));
  return (
    <div className="filter-controls">
      <div className="filter-tabs" role="group" aria-label="Фильтр сортов">
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
        <span>Категория</span>
        <select aria-label="Категория сортов" onChange={(event) => onCategoryChange(event.target.value as CategoryFilter)} value={category}>
          <option value="all">Все категории</option>
          {categories.map((itemCategory) => <option key={itemCategory} value={itemCategory}>{categoryLabels[itemCategory]}</option>)}
        </select>
      </label>
    </div>
  );
}
