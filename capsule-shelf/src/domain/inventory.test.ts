import { describe, expect, it } from "vitest";
import { adjustQuantity, getLowStockCapsuleIds, getTotalCapsules } from "./inventory";
import type { Capsule, InventoryEntry } from "./capsules";

const catalog: Capsule[] = [
  { id: "arpeggio", name: "Arpeggio", flavor: "Какао", category: "italian", imageUrl: "https://www.nespresso.com/a.png", sourceUrl: "https://www.nespresso.com/a" },
  { id: "volluto", name: "Volluto", flavor: "Бисквит", category: "heritage", imageUrl: "https://www.nespresso.com/v.png", sourceUrl: "https://www.nespresso.com/v" },
];

const entry = (quantity: number, favorite = false, threshold = 5): InventoryEntry => ({
  quantity,
  favorite,
  threshold,
  note: { rating: null, tastingNotes: "", recipes: "", suitableFor: "", unsuitableFor: "" },
});

describe("inventory calculations", () => {
  it("sums the quantities of all varieties", () => {
    expect(getTotalCapsules({ arpeggio: entry(8), volluto: entry(3) })).toBe(11);
  });

  it("adjusts quantities by integer steps without going below zero", () => {
    expect(adjustQuantity(2, -1)).toBe(1);
    expect(adjustQuantity(0, -1)).toBe(0);
    expect(() => adjustQuantity(1.5, 1)).toThrow(RangeError);
    expect(() => adjustQuantity(1, 0.5)).toThrow(RangeError);
    expect(() => adjustQuantity(Number.MAX_SAFE_INTEGER, 1)).toThrow(RangeError);
  });

  it("alerts only for favorites at or below their personal threshold", () => {
    const inventory = { arpeggio: entry(5, true, 5), volluto: entry(6, true, 5) };
    expect(getLowStockCapsuleIds(catalog, inventory)).toEqual(["arpeggio"]);
  });
});
