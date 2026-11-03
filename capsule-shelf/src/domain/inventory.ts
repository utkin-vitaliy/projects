import type { Capsule } from "./capsules";
import { DEFAULT_LOW_STOCK_THRESHOLD, type InventoryEntry, type InventoryState } from "./capsules";

export function getTotalCapsules(inventory: InventoryState): number {
  return Object.values(inventory).reduce((total, entry) => total + entry.quantity, 0);
}

export function adjustQuantity(quantity: number, delta: number): number {
  if (!Number.isSafeInteger(quantity) || quantity < 0 || !Number.isSafeInteger(delta)) {
    throw new RangeError("Quantity and adjustment must be safe integers; quantity cannot be negative.");
  }
  const adjusted = Math.max(0, quantity + delta);
  if (!Number.isSafeInteger(adjusted)) throw new RangeError("Adjusted quantity exceeds the safe integer range.");
  return adjusted;
}

export function getLowStockCapsuleIds(catalog: Capsule[], inventory: InventoryState): string[] {
  return catalog.flatMap((capsule) => {
    const entry: InventoryEntry | undefined = inventory[capsule.id];
    const threshold = entry?.threshold ?? DEFAULT_LOW_STOCK_THRESHOLD;
    return entry?.favorite && entry.quantity <= threshold ? [capsule.id] : [];
  });
}
