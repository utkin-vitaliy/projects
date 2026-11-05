# Vertuo recipes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add a translated, source-linked Vertuo recipe catalog that follows the selected capsule system and connects recipes to the matching Vertuo inventory cards.

**Architecture:** Keep Original recipes in their current module and add a focused Vertuo data module. A shared recipe collection feeds the recipe page and capsule-card links; the selected coffee system filters the page. Translations and photos are bundled locally, while every recipe retains its Nespresso source URL.

**Tech Stack:** React, TypeScript, Vitest, local `public/images/recipes` assets, existing `LocaleProvider` translations.

---

## File map

- Create `src/data/vertuoRecipes.ts`: verified Nespresso Canada Vertuo recipes, capsule IDs, image paths, and canonical source URLs.
- Modify `src/data/recipes.ts`: widen the system type to `"Original" | "Vertuo"` and retain the existing Original data and public image helper.
- Create `src/data/recipeCatalog.ts`: combine both line-specific catalogs and provide system-safe capsule lookup.
- Modify `src/i18n/catalogContent.ts`: English and French titles, capsule names, ingredients, and steps for every new recipe; Russian remains the seed language.
- Modify `src/i18n/locale.tsx`: remove the obsolete Vertuo Recipes coming-soon strings from English, Russian, and French.
- Modify `src/components/RecipesPage.tsx`: receive the selected system and derive cards, search results, and filter counts from that system.
- Modify `src/components/CapsuleCard.tsx`: show recipes found by the combined catalog, including Vertuo matches.
- Modify `src/App.tsx`: replace the Vertuo recipe placeholder with the Recipes page, pass the selected system, and validate saved favorite IDs against both recipe catalogs.
- Add official recipe images under `public/images/recipes/vertuo/`, with filenames derived from recipe IDs.
- Modify `src/data/recipes.test.ts`, `src/components/RecipesPage.test.tsx`, and `src/App.test.tsx`: cover catalog integrity, system filtering, counts, favorites, and navigation.

## Task 1: Add failing tests for the Vertuo recipe data contract

**Files:**
- Modify: `src/data/recipes.test.ts`
- Modify: `src/components/RecipesPage.test.tsx`
- Test: `src/data/recipes.test.ts`
- Test: `src/components/RecipesPage.test.tsx`

- [x] **Step 1: Add catalog integrity assertions**

Import `vertuoRecipes` from `./vertuoRecipes` and `vertuoCapsules` from `./vertuoCapsules`. Assert the data is non-empty; IDs are unique and start with `vertuo-`; each row has `line: "Vertuo"`, a non-empty ingredient list and steps, a `www.nespresso.com` source URL, one or more capsule IDs found in `vertuoCapsules`, and a local image URL under `/images/recipes/vertuo/`.

```ts
expect(vertuoRecipes.length).toBeGreaterThan(0);
expect(new Set(vertuoRecipes.map(({ id }) => id)).size).toBe(vertuoRecipes.length);
for (const recipe of vertuoRecipes) {
  expect(recipe.id).toMatch(/^vertuo-/);
  expect(recipe.line).toBe("Vertuo");
  expect(recipe.capsuleIds.length).toBeGreaterThan(0);
  expect(recipe.capsuleIds.every((id) => vertuoCapsules.some((capsule) => capsule.id === id))).toBe(true);
  expect(new URL(recipe.sourceUrl).hostname).toBe("www.nespresso.com");
  expect(recipe.imageUrl).toContain("/images/recipes/vertuo/");
}
```

- [x] **Step 2: Run the tests and confirm the new module and recipes are missing**

Run: `npm test -- --run src/data/recipes.test.ts src/components/RecipesPage.test.tsx`

Expected: FAIL because `vertuoRecipes` and system-aware page behavior are not implemented.

## Task 2: Curate, translate, and package the Vertuo recipes

**Files:**
- Create: `src/data/vertuoRecipes.ts`
- Modify: `src/i18n/catalogContent.ts`
- Create: `public/images/recipes/vertuo/` and one local photo file for each included recipe
- Test: `src/data/recipes.test.ts`

- [x] **Step 1: Build a source-backed candidate list before adding data**

Review the Nespresso Canada recipe listing, Canadian `/recipe?id=` pages, linked Nespresso recipe pages, and Nespresso-hosted Canada recipe PDFs. For each candidate, record the exact recommended coffee and verify its ID in `src/data/vertuoCapsules.ts`. Exclude candidates whose capsule is absent from that catalog, or whose Vertuo compatibility is not explicit in the source. Do not use Original or Professional substitutions.

Start with the verified official pages Black Iced (`black-iced`, Ice Forte), Golden Maple Pecan Reverso (`golden-maple-pecan-reverso`, Maple Pecan), Maple Pecan Latte (Melozio), Vertuo on Ice, Reverso Intenso, Nut Latte, and Espresso Macchiato Lime & Basil. Include a candidate only when its own source names a current catalog capsule and provides Vertuo-specific preparation instructions. In particular, do not infer the capsule represented only by an image or a generic “recommended coffees” panel.

- [x] **Step 2: Extend the recipe type to include Vertuo**

In `src/data/recipes.ts`, change the `CoffeeRecipe.line` field from the literal type `"Original"` to the union `"Original" | "Vertuo"`. Leave every existing Original object and its values unchanged.

- [x] **Step 3: Add Russian seed data with one row per verified recipe**

Use `CoffeeRecipe` and `resolvePublicAssetUrl` from `./recipes`. Each row has a `vertuo-` ID, `line: "Vertuo"`, exactly the verified `vertuo-*` capsule IDs, source URL, local image path, translated recipe metadata, ingredients, and ordered steps. Keep temperatures consistent with the drink served. Store Nespresso's time and difficulty in the existing card fields.

Use `vertuo-black-iced` as the first seed row: `temperature: "cold"`, Russian title `Чёрный кофе со льдом`, `time: "2 мин"`, `difficulty: "Легко"`, `capsule: "Ice Forte (230 мл)"`, `capsuleIds: ["vertuo-ice-forte"]`, `line: "Vertuo"`, `imageUrl: resolvePublicAssetUrl("images/recipes/vertuo/vertuo-black-iced.jpg")`, and `sourceUrl: "https://www.nespresso.com/ca/en/recipe?id=black-iced"`. Transcribe the ingredient quantities and ordered steps from that source into the remaining fields. Use the same complete field pattern for every other verified recipe.

- [x] **Step 4: Save each official Nespresso recipe image locally**

Use the recipe's own image from its Nespresso Canada page or its official Nespresso-hosted PDF. Save one optimized image per recipe under `public/images/recipes/vertuo/` using the recipe ID as the filename stem and the actual image format as its extension. Do not hotlink or substitute a visually similar image from another recipe.

- [x] **Step 5: Add English and French translations for each new recipe ID**

Extend both locale dictionaries used by `localizeRecipe` with title, capsule label, ingredients, and steps. Keep quantities, capsule extraction volume, and step order equivalent to the Russian source row. Verify every `vertuoRecipes` ID resolves to nonempty English and French text.

- [x] **Step 6: Run the catalog tests**

Run: `npm test -- --run src/data/recipes.test.ts`

Expected: PASS; each recipe is an official-source, current-catalog Vertuo match with local image path and all three languages.

## Task 3: Combine recipe data and make capsule matching system-safe

**Files:**
- Create: `src/data/recipeCatalog.ts`
- Modify: `src/components/CapsuleCard.tsx`
- Modify: `src/data/recipes.test.ts`

- [x] **Step 1: Add a failing cross-system matching test**

Import `getRecipesForCapsule` from `./recipeCatalog`. Assert `getRecipesForCapsule("vertuo-ice-forte")` contains `vertuo-black-iced` and has no recipe with `line: "Original"`. Assert `getRecipesForCapsule("vertuo-intenso")` has no Original recipe, and `getRecipesForCapsule("ice-forte")` has no Vertuo recipe. Keep current Original matching tests unchanged.

- [x] **Step 2: Add the combined recipe export and system-scoped universal matching**

Create `recipeCatalog.ts` with value imports of `recipes` and `vertuoRecipes` and a type-only import of `CoffeeRecipe`. Export `allRecipes = [...recipes, ...vertuoRecipes]`. Move `getRecipesForCapsule` from `recipes.ts` into `recipeCatalog.ts`, search `allRecipes`, and allow `allOriginalCapsules` only when `recipe.line === "Original"`. Keep `resolvePublicAssetUrl` in `recipes.ts`; `vertuoRecipes.ts` imports the recipe type and this helper while `recipes.ts` remains independent of Vertuo data.

```ts
export const allRecipes: CoffeeRecipe[] = [...recipes, ...vertuoRecipes];

export function getRecipesForCapsule(capsuleId: string): CoffeeRecipe[] {
  return allRecipes.filter((recipe) =>
    (recipe.line === "Original" && recipe.allOriginalCapsules === true)
      || recipe.capsuleIds.includes(capsuleId),
  );
}
```

- [x] **Step 3: Remove the Vertuo recipe suppression from capsule cards**

In `CapsuleCard`, always derive `matchingRecipes` from `getRecipesForCapsule(capsule.id)` and localize them. The system-safe matcher ensures only the right line appears.

- [x] **Step 4: Run matching tests**

Run: `npm test -- --run src/data/recipes.test.ts src/App.test.tsx`

Expected: PASS; Original links remain and Vertuo cards link only to their own recipes.

## Task 4: Filter the recipe page by the selected capsule system

**Files:**
- Modify: `src/components/RecipesPage.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/RecipesPage.test.tsx`
- Modify: `src/App.test.tsx`

- [x] **Step 1: Add failing page tests for system filtering and counts**

Update the `renderRecipesPage` helper to supply `system="original"`. Add a Vertuo case that supplies `system="vertuo"`, finds a known Vertuo recipe, does not find an Original-only recipe, and verifies the All, Favourites, Hot, and Cold counts come from Vertuo recipes only.

- [x] **Step 2: Add a required `system` prop and derive visible recipes from it**

Use `CoffeeSystem` from `src/storage/userSettings.ts` and select from `allRecipes` before applying favorite/hot/cold and multilingual search filters. Update direct test imports in `RecipesPage.test.tsx` to source any catalog fixtures from `recipeCatalog.ts`.

```tsx
type Props = {
  system: CoffeeSystem;
  favoriteIds?: string[];
  onFavoriteIdsChange?: (ids: string[]) => void;
};

const selectedLine = system === "vertuo" ? "Vertuo" : "Original";
const systemRecipes = allRecipes.filter((recipe) => recipe.line === selectedLine);
```

Compute All, Hot, Cold, and Favorites counts from `systemRecipes`; the favorites count is the number of current-system recipe IDs present in `favoriteIds`, not `favoriteIds.length`. Then render the existing localized cards. Add `system` to memo/effect dependencies where used.

- [x] **Step 3: Pass the selected system from `App` and remove the placeholder**

In `App.tsx`, import `allRecipes` from `recipeCatalog.ts` instead of `recipes` from `recipes.ts`, then pass `allRecipes.map(({ id }) => id)` to each `parseUserSettings` call that validates recipe favorites. Remove the `coffeeSystem === "vertuo" && activeView === "recipes"` coming-soon branch. Render `<RecipesPage system={coffeeSystem} favoriteIds={favoriteRecipeIds} onFavoriteIdsChange={setFavoriteRecipeIds} />` for both systems. Remove the now-unused `vertuoRecipesComingSoon` message from English, Russian, and French in `locale.tsx`. Keep the existing favorites key and Google Drive JSON shape unchanged.

- [x] **Step 4: Verify system switching preserves favorites and hides unrelated recipes**

Update the Vertuo `App.test.tsx` case: Recipes view shows Vertuo recipes, hides Original-only recipes, and switches back to the Original list when the top system selector changes. Add a Vertuo favorite, wait for settings to persist, unmount and reload, then assert that the saved Vertuo favorite remains selected. This catches an Original-only ID whitelist in settings parsing.

- [x] **Step 5: Run page and app tests**

Run: `npm test -- --run src/components/RecipesPage.test.tsx src/App.test.tsx`

Expected: PASS; the page uses only the active system for cards, counts, search, and favorite filtering.

## Task 5: Verify multilingual content, image files, and linked navigation

**Files:**
- Modify: `src/data/recipes.test.ts`
- Modify: `src/components/RecipesPage.test.tsx`
- Modify: `src/App.test.tsx`
- Assets: `public/images/recipes/vertuo/`

- [x] **Step 1: Add translation and image existence assertions**

For every Vertuo recipe, assert `localizeRecipe(recipe, "en")` and `localizeRecipe(recipe, "fr")` have translated titles, capsule labels, ingredients, and steps. Use `existsSync` to assert the file corresponding to each local image URL exists under `public/images/recipes/vertuo/`.

- [x] **Step 2: Test search by localized recipe and capsule names**

In `RecipesPage.test.tsx`, render with `system="vertuo"`, select EN and FR through the existing locale control, search each localized title and capsule name, and verify the matching Vertuo card appears. Restore the locale to Russian between cases. Verify that none of these results contain an Original-only card.

- [x] **Step 3: Test capsule-to-recipe navigation**

In `App.test.tsx`, select Vertuo, expand a recipe toggle on a capsule with an included recipe, click the link, and assert the recipe view opens with the matching card focused. Confirm the source link on the recipe card uses the official Nespresso URL.

- [x] **Step 4: Run focused tests**

Run: `npm test -- --run src/data/recipes.test.ts src/components/RecipesPage.test.tsx src/App.test.tsx`

Expected: PASS; all seeded Vertuo content is localized, packaged locally, and navigable from its capsule.

## Task 6: Full verification and local preview

**Files:**
- Modify only the file named by a failing assertion if verification exposes a defect.

- [x] **Step 1: Run all tests and production build**

Run: `npm test -- --run && npm run build`

Expected: all test files pass, and Vite prints `✓ built`.

- [x] **Step 2: Review the local Vertuo Recipes page**

Open `http://127.0.0.1:5177/#recipes`, ensure Vertuo is selected, confirm cards use local photos and Russian/English/French copy changes with the language control, and test a cold/hot filter, favorite, capsule-card link, and source link. Switch to Original and confirm its existing recipes are unchanged.

- [x] **Step 3: Report the locally previewable state**

Keep the local server running for review. Do not commit or push recipe implementation until the user asks.
