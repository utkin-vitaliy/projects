export type CapsuleRating = "like" | "neutral" | "dislike" | null;
export type CapsuleCategory = "limited" | "italian" | "decaffeinated" | "world" | "origins" | "flavoured" | "heritage";
export type CapsuleCupSize = "ristretto" | "espresso" | "doubleEspresso" | "granLungo" | "coffee" | "alto";

export type CapsuleNote = {
  rating: CapsuleRating;
  tastingNotes: string;
  recipes: string;
  suitableFor: string;
  unsuitableFor: string;
};

export type Capsule = {
  id: string;
  system?: "original" | "vertuo";
  name: string;
  flavor: string;
  intensity?: number;
  cupSize?: { type: CapsuleCupSize; millilitres: number };
  category: CapsuleCategory;
  imageUrl: string;
  imageFit?: "cover" | "contain";
  sourceUrl: string;
};

export type InventoryEntry = {
  quantity: number;
  favorite: boolean;
  threshold: number;
  note: CapsuleNote;
};

export type InventoryState = Record<string, InventoryEntry>;

export const DEFAULT_LOW_STOCK_THRESHOLD = 5;

export function createEmptyInventoryEntry(): InventoryEntry {
  return {
    quantity: 0,
    favorite: false,
    threshold: DEFAULT_LOW_STOCK_THRESHOLD,
    note: { rating: null, tastingNotes: "", recipes: "", suitableFor: "", unsuitableFor: "" },
  };
}
