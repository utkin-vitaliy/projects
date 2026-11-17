export type CapsuleRating = "like" | "neutral" | "dislike" | null;
export type CapsuleCategory = "limited" | "italian" | "decaffeinated" | "world" | "origins" | "flavoured" | "heritage" | "thirdParty";
export type CapsuleCupSize = "ristretto" | "espresso" | "doubleEspresso" | "granLungo" | "coffee" | "alto";
export type CapsuleCollection = "ispirazione" | "worldExplorations" | "classics" | "masterOrigin" | "revivingOrigins" | "limitedEdition" | "baristaCreations" | "starbucks" | "blueBottle" | "coffeePlus" | "perfectOverIce" | "decaffeinatedCoffees" | "longCups" | "shortCups";
export type CapsuleSortMetric = "quantity" | "intensity" | "caffeine" | "bitterness" | "acidity" | "body" | "roasting" | "coffeeGrams";
export type CapsuleSort = "catalog" | `${CapsuleSortMetric}-${"asc" | "desc"}`;

export type CapsuleCoffeeProfile = {
  aromaticProfile?: string;
  coffeeGrams?: number;
  bitterness?: number;
  acidity?: number;
  body?: number;
  roasting?: number;
  caffeineMg?: number;
  includesRobusta?: boolean;
};

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
  brand?: string;
  flavor: string;
  intensity?: number;
  coffeeProfile?: CapsuleCoffeeProfile;
  collection?: CapsuleCollection;
  cupSize?: { type: CapsuleCupSize; millilitres: number };
  category: CapsuleCategory;
  imageUrl: string;
  imageFit?: "cover" | "contain";
  imageBackground?: "white";
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
