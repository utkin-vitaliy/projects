import type { Capsule, CapsuleNote, InventoryEntry } from "../domain/capsules";
import { CapsuleCard } from "./CapsuleCard";

type Props = {
  catalog: Capsule[];
  inventory: Record<string, InventoryEntry>;
  lowStockIds: string[];
  onQuantitySet: (id: string, quantity: number) => void;
  onFavoriteToggle: (id: string) => void;
  onThresholdChange: (id: string, value: number) => void;
  onNoteSave: (id: string, note: CapsuleNote) => void;
};

export function CapsuleGrid({ catalog, inventory, lowStockIds, onQuantitySet, onFavoriteToggle, onThresholdChange, onNoteSave }: Props) {
  if (catalog.length === 0) {
    return <div className="empty-filter" role="status"><span aria-hidden="true">✦</span><p>Здесь пока пусто</p><small>Отметь любимый сорт или проверь пороги запаса.</small></div>;
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
          onThresholdChange={onThresholdChange}
        />
      ))}
    </div>
  );
}
