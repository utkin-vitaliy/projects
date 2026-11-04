import type { Capsule, CapsuleNote, InventoryEntry } from "../domain/capsules";
import { CapsuleCard } from "./CapsuleCard";
import { useLocale } from "../i18n/locale";

type Props = {
  catalog: Capsule[];
  inventory: Record<string, InventoryEntry>;
  lowStockIds: string[];
  onQuantitySet: (id: string, quantity: number) => void;
  onFavoriteToggle: (id: string) => void;
  onThresholdChange: (id: string, value: number) => void;
  onNoteSave: (id: string, note: CapsuleNote) => void;
  onRecipeSelect: (recipeId: string) => void;
};

export function CapsuleGrid({ catalog, inventory, lowStockIds, onQuantitySet, onFavoriteToggle, onThresholdChange, onNoteSave, onRecipeSelect }: Props) {
  const { t } = useLocale();
  if (catalog.length === 0) {
    return <div className="empty-filter" role="status"><span aria-hidden="true">✦</span><p>{t("emptyTitle")}</p><small>{t("emptyTip")}</small></div>;
  }

  return (
    <div className="capsule-grid">
      {catalog.map((capsule) => (
        <CapsuleCard
          capsule={capsule}
          entry={inventory[capsule.id]}
          key={capsule.id}
          lowStock={lowStockIds.includes(capsule.id)}
          onFavoriteToggle={onFavoriteToggle}
          onNoteSave={onNoteSave}
          onQuantitySet={onQuantitySet}
          onRecipeSelect={onRecipeSelect}
          onThresholdChange={onThresholdChange}
        />
      ))}
    </div>
  );
}
