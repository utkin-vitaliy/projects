# Vertuo Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the Nespresso Canada Vertuo capsule catalog with independent inventory state, useful capsule metadata, localization, and preserved Google Drive synchronization.

**Architecture:** Keep the existing `Capsule` data model and inventory hook, extending them with optional cup-size and category data plus a selected catalog argument. Pass all system catalogs to settings parsing and persistence, while showing and summarizing only the selected catalog. Vertuo IDs use a `vertuo-` prefix and recipe view remains a localized placeholder.

**Tech Stack:** React, TypeScript, Vite, Vitest, existing localStorage and Google Drive JSON synchronization.

**Spec:** `docs/superpowers/specs/2026-11-04-vertuo-catalog.md`

## Global Constraints

- Include only individual Vertuo capsule products presented in the Canadian catalog; exclude sets, machines, accessories, and prices.
- Vertuo recipe content remains out of scope.
- Preserve existing Original behavior and user data.
- Keep catalog content localized in English, Russian, and French.
- Do not add runtime catalog fetching or new dependencies.

## Review Focus

- Switching systems immediately after editing inventory must not lose unsaved changes.
- Returning to either system after refresh must preserve its entries and keep the other system’s records.
- Category, favorite, and low-stock filtering must count and filter only the selected catalog.
- A missing or malformed optional Vertuo field in an older settings file must not discard Original inventory.
- Missing product images must use the existing image fallback without breaking card layout.

---

### Task 1: Vertuo catalog data and localization

**Files:**
- Create: `src/data/vertuoCapsules.ts`
- Modify: `src/domain/capsules.ts`
- Modify: `src/i18n/catalogContent.ts`
- Test: `src/data/vertuoCapsules.test.ts`

**Interfaces:**
- Consumes: existing `Capsule` definition and `localizeCapsule` function.
- Produces: `vertuoCapsules: Capsule[]`; optional `cupSize` on `Capsule`; localized `flavor` strings for every Vertuo ID.

- [ ] **Step 1: Write failing catalog tests** for unique prefixed IDs, Canadian Vertuo product source URLs, excluded non-capsule sets, valid cup sizes, and complete English/French flavor translations.
- [ ] **Step 2: Run `npm test -- --run src/data/vertuoCapsules.test.ts`** and confirm failures for the missing catalog/export.
- [ ] **Step 3: Add the individual products presented in the Canadian catalog**, their Canadian product-page links, cup volumes, official intensity where listed, and locally bundled images; exclude bundles and accessories.
- [ ] **Step 4: Add optional `cupSize` to `Capsule` and English/French flavor text for Vertuo IDs.** Keep the source’s official product name and Russian flavor text in the catalog data.
- [ ] **Step 5: Re-run the catalog test** and confirm it passes.

### Task 2: Selected-system inventory and controls

**Files:**
- Modify: `src/features/inventory/useInventory.ts`
- Modify: `src/components/InventoryFilters.tsx`
- Modify: `src/components/CapsuleGrid.tsx`
- Modify: `src/components/InventorySummary.tsx`
- Modify: `src/i18n/locale.tsx`
- Modify: `src/App.tsx`
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes: `capsules` and `vertuoCapsules` arrays.
- Produces: selected-system catalog passed to inventory views and `cupSize` display on capsule cards.

- [ ] **Step 1: Write failing UI tests** for Vertuo-specific products, cup-size metadata, filtering/counts restricted to Vertuo, and independent Original/Vertuo inventory and notes across toggles and reloads.
- [ ] **Step 2: Run the relevant App tests** and confirm they fail because Vertuo still shows the placeholder.
- [ ] **Step 3: Refactor `useInventory`** to normalize the combined catalog in storage while deriving visible capsules, counts, thresholds, and categories from the selected catalog. Preserve unknown IDs while switching.
- [ ] **Step 4: Pass the selected catalog to filters and summaries**, render `cupSize` on cards, and localize category labels as needed.
- [ ] **Step 5: Render the Vertuo capsule catalog for the inventory view while keeping the recipes view at its existing localized coming-soon state.**
- [ ] **Step 6: Run the relevant App tests** and confirm switching/reload/filter behaviors pass.

### Task 3: Settings and Drive compatibility

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/storage/userSettings.ts`
- Modify: `src/storage/userSettings.test.ts`
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes: combined catalog and selected `CoffeeSystem` from the system-selector work.
- Produces: parsed and serialized settings retaining records for both catalogs and the selected system.

- [ ] **Step 1: Write failing settings tests** verifying Original and Vertuo entries round-trip together, malformed optional Vertuo entries do not break Original settings, and the selected system is included in Drive-comparable settings.
- [ ] **Step 2: Run settings and Drive tests** and confirm the expected failure before implementation.
- [ ] **Step 3: Parse and serialize inventory using the combined catalog** and include all Vertuo inventory records in comparison and Drive payloads.
- [ ] **Step 4: Run all tests and `npm run build`**; confirm no regressions.
