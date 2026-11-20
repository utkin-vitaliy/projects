import { describe, expect, it } from "vitest";
import { capsules } from "./capsules";
import type { CapsuleCategory } from "../domain/capsules";

const expectedCategories: CapsuleCategory[] = ["limited", "italian", "decaffeinated", "world", "origins", "flavoured", "heritage", "thirdParty"];

const originalIds = ["arpeggio", "ristretto", "napoli", "kazaar", "roma", "venezia", "livanto", "capriccio", "volluto", "cosi", "colombia"];

describe("Original-compatible capsule catalog", () => {
  it("has unique stable IDs and retains every existing product ID", () => {
    const ids = capsules.map(({ id }) => id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(expect.arrayContaining(originalIds));
    expect(capsules.length).toBe(120);
  });

  it("assigns every product a valid category and product source link", () => {
    expect(capsules.every(({ category }) => expectedCategories.includes(category))).toBe(true);
    expect(capsules.every(({ sourceUrl }) => sourceUrl.startsWith("https://"))).toBe(true);
  });

  it("assigns a collection to every Nespresso capsule so cards never show a generic family label", () => {
    const nespressoCapsules = capsules.filter(({ brand }) => !brand);
    expect(nespressoCapsules.every(({ collection }) => collection !== undefined)).toBe(true);
    expect(capsules.filter(({ brand }) => brand).every(({ collection }) => collection === undefined)).toBe(true);
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
    expect(capsules.filter(({ category }) => category === "thirdParty")).toHaveLength(78);
    expect(capsules.filter(({ category }) => category === "thirdParty").map(({ brand }) => brand)).toEqual(expect.arrayContaining(["Starbucks", "Tim Hortons", "Lavazza", "illy", "McCafé", "L’OR", "Caffè Aroma", "Caffè Borbone", "Café AGGA"]));
    expect(capsules.filter(({ brand }) => brand === "Caffè Aroma").map(({ id }) => id)).toEqual(expect.arrayContaining(["caffe-aroma-barista", "caffe-aroma-intenso", "caffe-aroma-cremoso", "caffe-aroma-decaf"]));
    expect(capsules.filter(({ brand }) => brand === "Caffè Borbone").map(({ id }) => id)).toEqual(expect.arrayContaining(["borbone-crema-classica", "borbone-gold", "borbone-blue", "borbone-nocciolino", "borbone-espresso-intenso", "borbone-crema-superiore", "borbone-100-arabica", "borbone-aluminum-decaf", "borbone-respresso-red", "borbone-respresso-black", "borbone-respresso-dek", "borbone-ginseng"]));
    expect(capsules.filter(({ brand }) => brand === "Café AGGA").map(({ id }) => id)).toEqual(expect.arrayContaining(["cafe-agga-intenso", "cafe-agga-fortissimo", "cafe-agga-kenya-aa", "cafe-agga-bellagio-forte", "cafe-agga-cremoso", "cafe-agga-lungo", "cafe-agga-baciami", "cafe-agga-ristretto", "cafe-agga-dolce-vita", "cafe-agga-organico", "cafe-agga-decaffeinato"]));
  });
});
