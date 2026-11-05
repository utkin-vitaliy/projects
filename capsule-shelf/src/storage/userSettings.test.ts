import { describe, expect, it } from "vitest";
import { capsules } from "../data/capsules";
import { recipes } from "../data/recipes";
import type { InventoryState } from "../domain/capsules";
import { serializeInventory } from "./inventoryStorage";
import { parseUserSettings, serializeUserSettings } from "./userSettings";

const inventory: InventoryState = {
  arpeggio: {
    quantity: 12,
    favorite: true,
    threshold: 3,
    note: { rating: "like", tastingNotes: "Cocoa", recipes: "Cappuccino", suitableFor: "Milk", unsuitableFor: "" },
  },
  "retired-variety": {
    quantity: 4,
    favorite: false,
    threshold: 2,
    note: { rating: null, tastingNotes: "", recipes: "", suitableFor: "", unsuitableFor: "" },
  },
};

describe("user settings storage", () => {
  it("round trips inventory, recipe favourites, locale, and timestamp", () => {
    const settings = {
      format: "capsule-shelf-user-settings" as const,
      version: 1 as const,
      updatedAt: "2026-11-04T12:00:00.000Z",
      locale: "fr" as const,
      system: "vertuo" as const,
      inventory,
      favoriteRecipes: ["cappuccino", "nespresso-martini-original"],
    };

    expect(parseUserSettings(serializeUserSettings(settings), capsules, recipes.map(({ id }) => id))).toMatchObject(settings);
  });

  it("defaults older settings without a system selection to Original", () => {
    const raw = JSON.stringify({
      format: "capsule-shelf-user-settings",
      version: 1,
      updatedAt: "2026-11-04T12:00:00.000Z",
      locale: "en",
      inventory,
      favoriteRecipes: [],
    });

    expect(parseUserSettings(raw, capsules, recipes.map(({ id }) => id)).system).toBe("original");
  });

  it("imports existing inventory-only backups without dropping unknown varieties", () => {
    const parsed = parseUserSettings(serializeInventory(inventory), capsules, recipes.map(({ id }) => id), "ru");

    expect(parsed.locale).toBe("ru");
    expect(parsed.favoriteRecipes).toEqual([]);
    expect(parsed.inventory.arpeggio.quantity).toBe(12);
    expect(parsed.inventory["retired-variety"].quantity).toBe(4);
  });

  it("drops invalid recipe IDs and uses a safe locale fallback", () => {
    const raw = JSON.stringify({
      format: "capsule-shelf-user-settings",
      version: 1,
      updatedAt: "2026-11-04T12:00:00.000Z",
      locale: "de",
      inventory,
      favoriteRecipes: ["cappuccino", "unknown-recipe", 2],
    });

    const parsed = parseUserSettings(raw, capsules, recipes.map(({ id }) => id));
    expect(parsed.locale).toBe("en");
    expect(parsed.favoriteRecipes).toEqual(["cappuccino"]);
  });

  it("rejects invalid JSON and unsupported document versions", () => {
    expect(() => parseUserSettings("not json", capsules, [])).toThrow("корректным JSON");
    expect(() => parseUserSettings(JSON.stringify({ format: "capsule-shelf-user-settings", version: 8 }), capsules, [])).toThrow(/формат/i);
  });
});
