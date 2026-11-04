# Capsule-to-Recipe Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users open a recipe that uses a selected capsule directly from that capsule's inventory card.

**Architecture:** Add explicit capsule IDs to recipe records, including universal Original recipes. Capsule cards expose an expandable list of matching recipe links. App coordinates the view switch; RecipesPage scrolls to and focuses the selected recipe card after it renders.

**Tech Stack:** React, TypeScript, Vitest, Testing Library, CSS.

**Spec:** `docs/superpowers/specs/2026-11-03-capsule-recipe-links-design.md`

## Global Constraints

- Preserve the JSON inventory format and contents.
- Keep the existing conditional two-view navigation and recipe filters.
- Include both explicitly named and universal Original recipes in capsule matches.
- Use stable recipe IDs as anchor targets and focus the destination card after navigation.

## Review Focus

- A recipe names multiple capsules: every named capsule must receive its link.
- A universal Original recipe: it must be linked from every capsule card.
- A capsule with no explicit match beyond universal recipes: show only applicable links.
- Recipe navigation from the capsule view: switch views before scrolling/focusing.
- Recipe filter state and section unmounting: the target remains present and focusable after navigation.

---

### Task 1: Add capsule-to-recipe relationships and navigation

**Files:**
- Modify: `src/data/recipes.ts`
- Modify: `src/data/recipes.test.ts`
- Modify: `src/components/CapsuleCard.tsx`
- Modify: `src/components/CapsuleGrid.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/RecipesPage.tsx`
- Modify: `src/styles.css`
- Test: `src/App.test.tsx`
- Test: `src/components/RecipesPage.test.tsx`

**Interfaces:**
- Add `capsuleIds: string[]` to `CoffeeRecipe`; use `allOriginalCapsules?: boolean` for universal recipes.
- Pass `onRecipeSelect(recipeId: string)` from `App` through `CapsuleGrid` to `CapsuleCard`.
- Pass a pending `targetRecipeId: string | null` to `RecipesPage`; consume it after the target article scrolls into view and receives focus.

- [x] **Step 1: Write failing tests** for explicit/multi-capsule and universal recipe matching, expandable matching recipe links on capsule cards, and selecting a link to switch views and focus the target recipe card.
- [x] **Step 2: Run targeted tests** with `npm test -- --run src/data/recipes.test.ts src/components/RecipesPage.test.tsx src/App.test.tsx`; confirmed the new assertions failed before implementation.
- [x] **Step 3: Implement** the explicit recipe relationships, expandable card links, and deferred view-switch/scroll/focus behavior. Styled the link list to fit the current capsule card layout and support focus-visible states.
- [x] **Step 4: Run verification** with `npm test -- --run`, `npm run build`, and `git diff --check`; all pass.
