import { describe, expect, it } from "vitest";
import { capsules } from "../data/capsules";
import { loadInventory } from "./inventoryStorage";

describe("inventory storage", () => {
  it("creates empty entries for the catalogue on first launch", () => {
    const inventory = loadInventory(capsules, null);
    expect(Object.keys(inventory)).toEqual(capsules.map(({ id }) => id));
    expect(inventory.arpeggio).toMatchObject({ quantity: 0, favorite: false, threshold: 5 });
  });

  it("parses personal inventory and notes from legacy JSON", () => {
    const raw = JSON.stringify({ version: 1, inventory: {
      arpeggio: {
        quantity: 7,
        favorite: true,
        threshold: 3,
        note: { rating: "like", tastingNotes: "Какао", recipes: "Капучино", suitableFor: "Эспрессо", unsuitableFor: "Лунго" },
      },
    } });
    expect(loadInventory(capsules, raw).arpeggio).toMatchObject({
      quantity: 7,
      favorite: true,
      threshold: 3,
      note: { rating: "like", tastingNotes: "Какао", recipes: "Капучино", suitableFor: "Эспрессо", unsuitableFor: "Лунго" },
    });
  });

  it("falls back to an empty inventory for corrupt or old storage", () => {
    expect(loadInventory(capsules, "{").arpeggio.quantity).toBe(0);
    expect(loadInventory(capsules, JSON.stringify({ version: 9, inventory: {} })).arpeggio.favorite).toBe(false);
  });

  it("ignores unknown varieties and invalid stored quantities", () => {
    const raw = JSON.stringify({
      version: 1,
      inventory: {
        arpeggio: { quantity: -3, favorite: true, threshold: 5, note: {} },
        removed: { quantity: 50, favorite: true, threshold: 5, note: {} },
      },
    });
    const inventory = loadInventory(capsules, raw);
    expect(inventory.arpeggio.quantity).toBe(0);
    expect(inventory.arpeggio.favorite).toBe(true);
    expect(inventory).not.toHaveProperty("removed");
  });
});
