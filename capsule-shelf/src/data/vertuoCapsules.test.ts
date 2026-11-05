import { describe, expect, it } from "vitest";
import { vertuoCapsules } from "./vertuoCapsules";
import { localizeCapsule } from "../i18n/catalogContent";

describe("Nespresso Canada Vertuo catalog", () => {
  it("contains distinct Vertuo capsule IDs and Canadian product pages", () => {
    const ids = vertuoCapsules.map(({ id }) => id);

    expect(ids.length).toBeGreaterThan(35);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id.startsWith("vertuo-"))).toBe(true);
    expect(vertuoCapsules.every(({ sourceUrl }) => sourceUrl === "https://www.nespresso.com/ca/en/order/capsules/vertuo")).toBe(true);
    expect(vertuoCapsules.every(({ imageUrl }) =>
      /^https:\/\/www\.nespresso\.com\/ecom\/medias\/sys_master\/public\/[^/]+\/[^?]+\?/.test(imageUrl),
    )).toBe(true);
    expect(ids).toEqual(expect.arrayContaining([
      "vertuo-crystal-spark",
      "vertuo-hazelnut-brownie",
      "vertuo-blueberry-cheesecake",
      "vertuo-peppermint-pinwheel",
      "vertuo-gingerbread",
      "vertuo-starbucks-holiday-blend",
      "vertuo-mexico",
      "vertuo-arondio",
      "vertuo-colombia",
      "vertuo-el-salvador",
      "vertuo-half-caffeinato",
      "vertuo-carafe-pour-over-style",
    ]));
    expect(ids).not.toEqual(expect.arrayContaining([
      "vertuo-tanzania",
      "vertuo-french-lavender-vanilla-decaffeinato",
      "vertuo-white-chocolate-strawberry",
    ]));
  });

  it("keeps sets out and includes cup size and English/French flavor text", () => {
    expect(vertuoCapsules.some(({ name }) => /set|assortment/i.test(name))).toBe(false);
    expect(vertuoCapsules.every(({ cupSize }) => Boolean(cupSize))).toBe(true);

    for (const capsule of vertuoCapsules) {
      expect(localizeCapsule(capsule, "en").flavor).not.toBe(capsule.flavor);
      expect(localizeCapsule(capsule, "fr").flavor).not.toBe(capsule.flavor);
    }
  });
});
