# Capsule Shelf Current Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand Capsule Shelf from 11 products to the distinct Nespresso Original coffee varieties currently listed on Nespresso Canada and make the larger list easy to browse.

**Architecture:** Extend the typed catalog with stable categories and a deduplicated, manually maintained snapshot of current individual coffee products. Keep product metadata and official image links in source code; add a category selector that composes with existing all/favorites/low-stock filters.

**Tech Stack:** React, TypeScript, Vite, Vitest, React Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-03-capsule-shelf-current-catalog-design.md`.

## Global Constraints

- Use the Nespresso Canada Original catalog as the source for the snapshot and product links.
- Include each distinct individual coffee variety once, including limited editions shown at implementation time.
- Exclude capsule kits, assortments, gift sets, advent calendars, machines, accessories, and syrups.
- Keep all existing 11 product IDs stable so stored inventory and notes remain linked.
- Use official Nespresso image URLs with per-card fallback and direct Canada product source links.
- Do not scrape or synchronize the website at runtime.

## Review Focus

- Duplicate products listed in multiple website sections must map to one stable ID; test unique IDs.
- Seasonal items can disappear from the site later; keep removed records in the stored file and do not break rendering of the current catalog.
- Catalog filter must compose correctly with favorite and low-stock filters; test all three combinations.
- Missing image URLs must leave the product card usable; preserve and test the existing fallback.
- Category options must derive from the catalog and not include categories with no products; test the derived option set.

---

### Task 1: Typed catalog categories and current Nespresso snapshot

**Files:**
- Modify: `src/domain/capsules.ts`
- Modify: `src/data/capsules.ts`
- Create: `src/data/capsules.test.ts`
- Modify: `src/App.test.tsx`

**Interfaces:**
- Add `CapsuleCategory` values: `limited`, `italian`, `decaffeinated`, `world`, `origins`, `flavoured`, `heritage`.
- Add required `category: CapsuleCategory` to `Capsule`.
- Keep product ID stable, lowercase kebab-case; source links point to Nespresso Canada product pages.

- [x] Write failing tests for unique IDs, all current 11 IDs retained, category validity, unknown stored IDs remaining untouched during app saves, and representative entries from each site section, including current limited editions and decaffeinated products.
- [x] Run `npx vitest run src/data/capsules.test.ts` and confirm failures represent missing type/data behavior.
- [x] Add the deduplicated current snapshot (40 individual coffee products based on the live page), product flavor summaries, intensities where listed, official image URLs, and source links.
- [x] Run catalog and storage tests; confirm old user data remains addressable and repeated site placements appear once.
- [x] Commit `feat: expand Nespresso Canada Original catalog` (`936e4ac`).

### Task 2: Category browsing

**Files:**
- Modify: `src/components/InventoryFilters.tsx`
- Modify: `src/features/inventory/useInventory.ts`
- Modify: `src/App.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Keep existing all/favorites/low-stock selection.
- Add a category selector that composes with the existing filter; derive choices from catalog categories.

- [x] Write failing UI tests for category options derived only from populated categories, category filtering, category + favorite/low-stock composition, unknown stored IDs staying hidden without crashing, and a category with no matching favorite/low-stock products.
- [x] Run `npx vitest run src/App.test.tsx` and confirm the new category expectations fail.
- [x] Implement category filtering and compact responsive selector styles while preserving existing visual hierarchy and reduced-motion support.
- [x] Run the focused UI tests and existing app suite.
- [x] Commit `feat: filter capsule catalog by category` (`eb9deef`).

### Task 3: Source and release verification

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-11-03-file-storage-and-current-catalog-design.md`

- [x] Record catalog snapshot date, Nespresso Canada source URL, product inclusion/exclusion rules, and the manual-update limitation.
- [x] Run `npm test -- --run`, `npm run build`, and `git diff --check`.
- [x] Check all 40 catalog image URLs in browser; verified the existing fallback in the UI test suite.
- [ ] Commit `docs: record catalog snapshot source`.

## Self-review

- Product metadata and IDs stay separate from per-user inventory. Categories are strongly typed and selector options derive from data.
- The catalog is a snapshot rather than a crawler; the page's repeated category placements are deduplicated by stable ID.
- This plan does not alter persistence; file storage has a separate plan.

### Task 4: Show the complete capsule and enter stock directly

**Files:** `src/components/CapsuleCard.tsx`, `src/components/CapsuleGrid.tsx`, `src/features/inventory/useInventory.ts`, `src/App.tsx`, `src/App.test.tsx`, `src/styles.css`.

- [x] Add failing tests for setting a large inventory count directly, retaining it after reload, and rejecting negative or fractional counts.
- [x] Add a number input that commits on blur or Enter, with adjacent plus/minus controls that adjust by one and cannot decrement below zero; keep API persistence and stock summaries in sync.
- [x] Fix the image element's intrinsic minimum sizing and give capsule photos a taller portrait area so each whole capsule remains visible; verified all three first-row capsules and number entry in the browser.
- [x] Run the full Vitest suite and production build.
