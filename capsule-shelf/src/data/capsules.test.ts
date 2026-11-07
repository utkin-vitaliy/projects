import { describe, expect, it } from "vitest";
import { capsules } from "./capsules";
import type { CapsuleCategory } from "../domain/capsules";

const expectedCategories: CapsuleCategory[] = ["limited", "italian", "decaffeinated", "world", "origins", "flavoured", "heritage"];

const originalIds = ["arpeggio", "ristretto", "napoli", "kazaar", "roma", "venezia", "livanto", "capriccio", "volluto", "cosi", "colombia"];

describe("Nespresso Canada Original catalog snapshot", () => {
  it("has unique stable IDs and retains every existing product ID", () => {
    const ids = capsules.map(({ id }) => id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(expect.arrayContaining(originalIds));
    expect(capsules.length).toBe(42);
  });

  it("assigns every product a valid category and official Canada product link", () => {
    expect(capsules.every(({ category }) => expectedCategories.includes(category))).toBe(true);
    expect(capsules.every(({ sourceUrl }) => sourceUrl.startsWith("https://www.nespresso.com/ca/en/order/capsules/original/"))).toBe(true);
  });

  it("includes representative current varieties from each distinct site section", () => {
    const byId = Object.fromEntries(capsules.map((capsule) => [capsule.id, capsule]));
    expect(byId["crystal-spark"].category).toBe("limited");
    expect(byId["ristretto-decaffeinato"].category).toBe("decaffeinated");
    expect(byId["athens-freddo-intenso"].category).toBe("world");
    expect(byId["kahawa-ya-congo"].category).toBe("origins");
    expect(byId.nocciola.category).toBe("flavoured");
    expect(byId.cosi.category).toBe("heritage");
    expect(byId.arpeggio.category).toBe("italian");
  });
});
