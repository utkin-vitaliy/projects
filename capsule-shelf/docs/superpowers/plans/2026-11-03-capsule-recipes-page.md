# Capsule Recipes Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Russian recipe view to CapsuleShelf with five Nespresso Canada recipes adapted to Nespresso Original capsules.

**Architecture:** Keep the current single React application and add a small in-memory view switch between inventory and recipes. Store the static translated recipe content in a typed data module and render it through a dedicated responsive recipe page component; do not add a router or backend state.

**Tech Stack:** React, TypeScript, CSS, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-03-capsule-recipes-page-design.md`

## Global Constraints

- Recipe text and preparation summaries are in Russian; keep capsule product names in official spelling.
- Limit this feature to five Original-compatible recipes and link each card to the Nespresso Canada source.
- Do not add a routing dependency, recipe persistence, favorites, or external API.
- Keep layout responsive and consistent with the existing warm, minimal CapsuleShelf visual style.

## Review Focus

- All five cards must remain visible and correctly structured after navigation: recipe view integration tests verify cards, titles and ingredients.
- Switching views must preserve in-memory inventory state: App integration test changes a quantity, visits recipes, returns and checks it.
- Source links must lead only to official Nespresso pages and open safely: recipe data tests validate the host, component tests validate `target` and `rel`.
- Vertuo-only capsules must not be presented as compatible with Original: recipe data test validates all five recipe entries are tagged Original-compatible and avoid Vertuo-only products.
- Recipe photos must load from official Nespresso media and have meaningful Russian alt text; visually inspect the finished photo cards.
- Long recipe names and step text must fit narrow screens: verify responsive styles in browser after the feature build.

---

### Task 1: Add typed, translated recipe content

**Files:**
- Create: `src/data/recipes.ts`
- Test: `src/data/recipes.test.ts`

**Interfaces:**
- Produces: `export type CoffeeRecipe` with `id`, `title`, `time`, `difficulty`, `capsule`, `ingredients: string[]`, `steps: string[]`, `sourceUrl`, and `line: "Original"`; `export const recipes: CoffeeRecipe[]`.

- [x] **Step 1: Write failing content tests**

Add tests that expect exactly five recipes with IDs `cappuccino`, `flat-white`, `iced-latte`, `latte-macchiato`, and `maple-pecan-cappuccino`; ensure each has Russian ingredient and step text, a source URL on `www.nespresso.com`, a non-empty Original capsule description, and no Vertuo-only capsule names.

- [x] **Step 2: Run the tests and confirm they fail because the recipe module is missing**

Run: `npm test -- --run src/data/recipes.test.ts`
Expected: FAIL because `src/data/recipes.ts` does not exist.

- [x] **Step 3: Implement the recipe module**

Use the five items and exact ingredient/step facts in the approved design spec. Summarize procedural language in Russian; source links must match the spec.

- [x] **Step 4: Run the recipe data tests**

Run: `npm test -- --run src/data/recipes.test.ts`
Expected: PASS with all five records validated.

### Task 2: Render responsive recipe cards

**Files:**
- Create: `src/components/RecipesPage.tsx`
- Create: `src/components/RecipesPage.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `recipes` and `CoffeeRecipe` from `src/data/recipes.ts`.
- Produces: `RecipesPage()` with a page heading, short intro, and semantic article cards containing recipe metadata, ingredients, ordered steps, and source link.

- [x] **Step 1: Write failing component tests**

Test that rendering `RecipesPage` shows all five recipe names, ingredient and preparation lists, and source links with `target="_blank"` and `rel="noreferrer"`.

- [x] **Step 2: Run the component test and confirm it fails because the component is missing**

Run: `npm test -- --run src/components/RecipesPage.test.tsx`
Expected: FAIL because `src/components/RecipesPage.tsx` does not exist.

- [x] **Step 3: Implement the page component and styles**

Render one semantic `<article>` per recipe with an `<h2>`, capsule/time/difficulty metadata, ingredient `<ul>`, numbered `<ol>`, and official source anchor. Use responsive CSS grid and the existing app palette; ensure the Russian copy wraps without truncation.

- [x] **Step 4: Run component tests**

Run: `npm test -- --run src/components/RecipesPage.test.tsx`
Expected: PASS. Responsive visual inspection takes place after Task 3 integrates this page into the app navigation, when the recipe screen is reachable from the running application.

### Task 3: Add navigation and preserve inventory view state

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

**Interfaces:**
- Consumes: `RecipesPage()` from `src/components/RecipesPage.tsx`.
- Produces: accessible `Капсулы` and `Рецепты` navigation controls that switch the visible view while the existing inventory hook stays mounted.

- [x] **Step 1: Write a failing navigation integration test**

Verify that both navigation controls are visible; clicking `Рецепты` shows recipe headings and hides quantity controls; clicking `Капсулы` returns to the inventory with an edited quantity intact.

- [x] **Step 2: Run the targeted integration test and confirm it fails because navigation is absent**

Run: `npm test -- --run src/App.test.tsx`
Expected: the new navigation test FAILS because the controls are not present.

- [x] **Step 3: Implement view navigation**

Add local React state for the active view, render accessible buttons in a labeled `<nav>`, and conditionally render the inventory dashboard or `RecipesPage`. Keep `useInventory()` at the `App` level so switching views does not discard state.

- [x] **Step 4: Run targeted tests and production build**

Run: `npm test -- --run src/App.test.tsx src/data/recipes.test.ts src/components/RecipesPage.test.tsx && npm run build`
Expected: all targeted tests pass and TypeScript/Vite production build exits 0.

### Task 4: Add official Nespresso photography to recipe cards

**Files:**
- Modify: `src/data/recipes.ts`
- Modify: `src/data/recipes.test.ts`
- Modify: `src/components/RecipesPage.tsx`
- Modify: `src/components/RecipesPage.test.tsx`
- Modify: `src/styles.css`

- [x] Add failing tests for official photo URLs, descriptive alt text and rendered images.
- [x] Add an Nespresso image and Russian alt description to each recipe.
- [x] Render responsive cover photos with a subtle hover zoom and lazy loading.
- [x] Verify each photo URL loads and visually review the recipe view in the browser.
- [x] Run the full test suite and production build.

### Task 5: Expand the recipe catalogue with seven researched recipes

**Files:**
- Modify: `src/data/recipes.ts`
- Modify: `src/data/recipes.test.ts`
- Modify: `src/components/RecipesPage.tsx`
- Modify: `src/components/RecipesPage.test.tsx`

- [x] Add seven more Nespresso Original recipes with Russian titles, ingredients, steps, and official source links.
- [x] Use official Nespresso photography and descriptive Russian alt text for each new card.
- [x] Update the catalogue count and generic source attribution for multilingual Nespresso pages.
- [x] Verify all twelve images load in the browser and review the rendered cards.
- [x] Run all tests and the production build.
