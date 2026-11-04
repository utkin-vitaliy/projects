import { describe, expect, it } from "vitest";
import * as recipeData from "./recipes";
import { getRecipesForCapsule, recipes } from "./recipes";

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
      expect(recipe.imageUrl).toMatch(/(?:^|\/)(?:images\/recipes|recipe-book)\/.+\.(?:jpg|png)$/);
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
