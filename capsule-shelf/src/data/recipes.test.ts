import { describe, expect, it } from "vitest";
// The Vitest file check runs in Node; the production TypeScript config omits Node globals.
// @ts-expect-error Node typings are intentionally not included in the browser app tsconfig.
import { existsSync } from "node:fs";
// @ts-expect-error Node typings are intentionally not included in the browser app tsconfig.
import { resolve } from "node:path";
import * as recipeData from "./recipes";
import { recipes } from "./recipes";
import { getRecipesForCapsule } from "./recipeCatalog";
import { vertuoCapsules } from "./vertuoCapsules";
import { vertuoRecipes } from "./vertuoRecipes";
import { localizeRecipe } from "../i18n/catalogContent";

declare const process: { cwd(): string };

describe("Nespresso Original recipes", () => {
  it("matches named and universal recipes to capsule IDs", () => {
    expect(getRecipesForCapsule("arpeggio").map(({ id }) => id)).toContain("maple-pecan-cappuccino");
    expect(getRecipesForCapsule("arpeggio").map(({ id }) => id)).toContain("cappuccino");
    expect(getRecipesForCapsule("ristretto").map(({ id }) => id)).toContain("iced-cappuccino");
    expect(getRecipesForCapsule("blueberry-cheesecake").map(({ id }) => id)).toEqual([
      "cappuccino", "iced-latte", "latte-macchiato",
    ]);
  });

  it("contains the approved recipes and eleven translated book recipes", () => {
    expect(recipes.slice(0, 23).map(({ id, title }) => [id, title])).toEqual([
      ["cappuccino", "Капучино"],
      ["flat-white", "Флэт уайт"],
      ["iced-latte", "Айс-латте"],
      ["latte-macchiato", "Латте макиато"],
      ["maple-pecan-cappuccino", "Кленовый капучино с пеканом"],
      ["mocha-latte", "Кофе мокка-латте"],
      ["muesli-coffee", "Кофе с мюсли"],
      ["iced-cappuccino", "Ледяной капучино"],
      ["iced-chocolate-coffee", "Холодный шоколадный кофе"],
      ["nespresso-on-ice", "Кофе Nespresso со льдом"],
      ["cafe-con-hielo", "Кофе по-испански со льдом"],
      ["espresso-on-ice-macchiato", "Макиато со льдом"],
      ["spiced-cookie-butter-latte", "Пряный латте с пастой из печенья"],
      ["dark-chocolate-pistachio-latte", "Латте с тёмным шоколадом и фисташкой"],
      ["dark-chocolate-peppermint-latte", "Латте с тёмным шоколадом и мятой"],
      ["campfire-latte", "Латте «У костра»"],
      ["fig-and-honey-latte-macchiato", "Латте макиато с инжиром и мёдом"],
      ["shaken-vietnamese-coffee", "Вьетнамский кофе со льдом"],
      ["iced-caramel-oat-latte", "Айс-латте с карамелью и овсяным молоком"],
      ["iced-mocha-mint-latte", "Айс-мокка с мятой"],
      ["iced-salted-caramel-latte", "Айс-латте с солёной карамелью"],
      ["pistachio-latte-milkshake", "Фисташковый кофейный милкшейк"],
      ["sweet-hazelnut-coffee-float", "Кофейный флоат с фундуком"],
    ]);
    expect(recipes).toHaveLength(67);
    expect(recipes.find(({ id }) => id === "flat-white")?.difficulty).toBe("Средняя");
  });

  it("uses only official Nespresso Canada sources and Original capsules", () => {
    for (const recipe of recipes) {
      expect(new URL(recipe.sourceUrl).hostname).toBe("www.nespresso.com");
      expect(recipe.sourceUrl).toMatch(/\/recipes\/(ca\/en|ru\/ru)\/|\/ncp\/res\/(generated\/recipes|uploads\/recipes)\/|\/static\/us\/solutions\/b2b\/documents\//);
      expect(recipe.line).toBe("Original");
      expect(recipe.capsule).not.toMatch(/Vertuo|Altissio/i);
    }
  });

  it("provides ingredients and Russian preparation steps for every recipe", () => {
    expect(recipes).toHaveLength(67);
    for (const recipe of recipes) {
      expect(recipe.ingredients.length).toBeGreaterThan(0);
      expect(recipe.steps.length).toBeGreaterThan(0);
      expect(recipe.ingredients.join(" ")).toMatch(/[А-Яа-яЁё]/);
      expect(recipe.steps.join(" ")).toMatch(/[А-Яа-яЁё]/);
      expect(recipe.time).toBeTruthy();
      expect(recipe.difficulty).toBeTruthy();
    }
  });

  it("includes a descriptive official Nespresso photo for each recipe", () => {
    for (const recipe of recipes) {
      expect(recipe.imageUrl).toMatch(/(?:^|\/)(?:images\/recipes|recipe-book)\/.+\.(?:jpe?g|png|webp)$/);
      expect(recipe.imageAlt.trim().length).toBeGreaterThan(15);
    }
  });

  it("builds public photo URLs under the configured application base path", () => {
    const resolvePublicAssetUrl = Reflect.get(recipeData, "resolvePublicAssetUrl") as ((path: string, baseUrl: string) => string) | undefined;
    expect(resolvePublicAssetUrl).toBeTypeOf("function");
    expect(resolvePublicAssetUrl?.("/recipe-book/example.jpg", "/projects/capsule-shelf/"))
      .toBe("/projects/capsule-shelf/recipe-book/example.jpg");
  });

  it("marks every professional-capsule substitution as an Original adaptation", () => {
    const bookRecipes = recipes.filter(({ sourcePage }) => sourcePage !== undefined);
    expect(bookRecipes).toHaveLength(11);
    expect(bookRecipes.map(({ sourcePage }) => sourcePage)).toEqual([6, 21, 23, 25, 27, 36, 38, 42, 54, 60, 65]);
    expect(bookRecipes.filter(({ adaptationNote }) => adaptationNote)).toHaveLength(7);
    for (const recipe of bookRecipes) {
      expect(recipe.sourceUrl).toContain(`#page=${recipe.sourcePage}`);
    }
  });
});

describe("cross-system recipe matching", () => {
  it("matches each capsule only to recipes from its own system", () => {
    expect(getRecipesForCapsule("vertuo-ice-forte").map(({ id }) => id)).toContain("vertuo-black-iced");
    expect(getRecipesForCapsule("vertuo-ice-forte").every(({ line }) => line === "Vertuo")).toBe(true);
    expect(getRecipesForCapsule("vertuo-intenso").every(({ line }) => line === "Vertuo")).toBe(true);
    expect(getRecipesForCapsule("arpeggio").every(({ line }) => line === "Original")).toBe(true);
    expect(getRecipesForCapsule("arpeggio").map(({ id }) => id)).toContain("cappuccino");
  });
});

describe("Nespresso Canada Vertuo recipes", () => {
  it("contains only uniquely identified recipes that name current Vertuo capsules", () => {
    const ids = vertuoRecipes.map(({ id }) => id);
    const capsuleIds = new Set(vertuoCapsules.map(({ id }) => id));

    expect(ids).toHaveLength(17);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
    for (const recipe of vertuoRecipes) {
      expect(recipe.id).toMatch(/^vertuo-/);
      expect(recipe.line).toBe("Vertuo");
      expect(recipe.capsuleIds.length).toBeGreaterThan(0);
      expect(recipe.capsuleIds.every((capsuleId) => capsuleIds.has(capsuleId))).toBe(true);
      expect(recipe.sourceUrl).toMatch(/^https:\/\/www\.nespresso\.com\//);
      expect(recipe.sourceUrl).toMatch(/^https:\/\/www\.nespresso\.com\/(?:ca\/en\/recipe\?id=[a-z0-9-]+|recipes\/ca\/en\/[A-Za-z0-9-]+\.html|ncp\/res\/generated\/recipes\/[A-Za-z0-9_]+\.pdf)$/);
      expect(recipe.ingredients.length).toBeGreaterThan(0);
      expect(recipe.steps.length).toBeGreaterThan(0);
      expect(recipe.imageUrl).toContain("/images/recipes/vertuo/");
    }
  });

  it("keeps the Vertuo-only Fireplace Pumpkin Latte variant and source metadata", () => {
    const recipe = vertuoRecipes.find(({ id }) => id === "vertuo-fireplace-pumpkin-latte");
    expect(recipe?.sourceUrl).toBe("https://www.nespresso.com/ca/en/recipe?id=fireplace-pumpkin-latte-vl");
    expect(recipe?.capsuleIds).toEqual(["vertuo-pumpkin-spice-cake"]);
    expect(recipe?.ingredients).toContain("1 капсула Pumpkin Spice Cake (230 мл)");
    expect(recipe?.steps).toContain("Приготовь сверху одну капсулу Pumpkin Spice Cake объёмом 230 мл.");
  });

  it("has a local official photo for every recipe", () => {
    for (const recipe of vertuoRecipes) {
      const imagePath = new URL(recipe.imageUrl, "https://capsule-shelf.test").pathname;
      const imageMarker = "/images/recipes/vertuo/";
      const markerIndex = imagePath.indexOf(imageMarker);
      expect(markerIndex).toBeGreaterThanOrEqual(0);
      const imageName = imagePath.slice(markerIndex + imageMarker.length);
      expect(existsSync(resolve(process.cwd(), "public/images/recipes/vertuo", imageName))).toBe(true);
    }
  });

  it("has English and French copy for every recipe field", () => {
    for (const recipe of vertuoRecipes) {
      for (const locale of ["en", "fr"] as const) {
        const localized = localizeRecipe(recipe, locale);
        expect(localized.title).not.toBe(recipe.title);
        expect(localized.capsule, `${recipe.id} (${locale})`).not.toBe(recipe.capsule);
        expect(localized.ingredients).not.toEqual(recipe.ingredients);
        expect(localized.steps).not.toEqual(recipe.steps);
        expect(localized.ingredients.join(" ")).toBeTruthy();
        expect(localized.steps.join(" ")).toBeTruthy();
      }
    }
  });
});
