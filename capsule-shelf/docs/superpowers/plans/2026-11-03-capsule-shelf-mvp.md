# Capsule Shelf MVP Implementation Plan

> **For agentic workers:** Use `superpowers:executing-plans` to implement this plan task by task. Steps use checkbox syntax for tracking.

**Goal:** Build a local-first inventory for Nespresso Original capsules with low-stock alerts and personal tasting notes.

**Architecture:** A typed product catalogue is separate from per-browser inventory records. Domain functions calculate totals and low-stock status; versioned localStorage persistence stores user quantities, favorites, thresholds, and notes.

**Tech Stack:** React, TypeScript, Vite, CSS, Vitest, React Testing Library.

**Spec:** Requirements and decisions recorded in the current chat before implementation.

## Global Constraints

- Nespresso Original only.
- Favorite varieties default to a low-stock threshold of 5; users can adjust it per variety.
- Alerts are in-app only.
- Inventory is browser-local and works without an account or backend.
- Quantities are non-negative integers.
- CSS motion respects `prefers-reduced-motion`.
- Catalog image URLs are static official Nespresso HTTPS CDN URLs with source-page links; broken images show a fallback.

## Review Focus

- Malformed localStorage JSON must not prevent app startup; test corrupt state fallback.
- Out-of-range quantity and threshold input must be clamped or rejected; test negative, fractional, and blank values.
- A favorited variety at exactly its threshold must alert; test threshold and threshold+1.
- Broken image URLs must preserve usable product cards; test image fallback.
- Rapid note edits must save the latest value; test edit and reload behavior.

---

### Task 1: Domain model and inventory calculations

**Files:** `src/domain/capsules.ts`, `src/domain/inventory.ts`, `src/domain/inventory.test.ts`.

- [x] Test total quantities across multiple varieties.
- [x] Test `adjustQuantity` permits non-negative integer changes and prevents underflow.
- [x] Test low-stock status applies only to favorites at `quantity <= threshold`.
- [x] Implement `Capsule`, `CapsuleNote`, `InventoryEntry`, `InventoryState`, `getTotalCapsules`, `adjustQuantity`, and `getLowStockCapsuleIds`.
- [x] Run `npm test -- --run` and `npm run build`.

### Task 2: Catalog and local persistence

**Files:** `src/data/capsules.ts`, `src/storage/inventoryStorage.ts`, `src/storage/inventoryStorage.test.ts`.

- [x] Test initial inventory state, storage round-trip, corrupt JSON fallback, and ignored unknown catalogue IDs.
- [x] Add a starter Original catalog with sourced product descriptions and official image URLs.
- [x] Implement schema-versioned storage under `capsule-shelf:inventory:v1`.
- [x] Run the full test suite and build.

### Task 3: Inventory dashboard

**Files:** `src/App.tsx`, `src/features/inventory/useInventory.ts`, `src/components/InventorySummary.tsx`, `src/components/CapsuleCard.tsx`, `src/components/CapsuleGrid.tsx`, `src/components/InventoryFilters.tsx`, `src/App.test.tsx`.

- [x] Test summary totals, all/favorites/low-stock filters, quantity controls, threshold edit, and in-app alerts.
- [x] Implement the responsive dashboard and persist all changes through the storage adapter.
- [x] Add accessible labels and product-image fallback behavior.
- [x] Run the full test suite and build.

### Task 4: Personal tasting notes

**Files:** `src/components/CapsuleNotes.tsx`, `src/components/CapsuleCard.tsx`, `src/features/inventory/useInventory.ts`, `src/App.test.tsx`.

- [x] Test rating, tasting notes, recipes, and suitable/unsuitable drink notes save per variety and survive reload.
- [x] Implement the expandable notes editor, with optional fields and explicit save feedback.
- [x] Run the full test suite and build.

### Task 5: Visual design and final verification

**Files:** `src/styles.css`, `index.html`, `README.md`.

- [x] Add the minimal responsive visual system, restrained CSS transitions, and reduced-motion rules.
- [x] Document local startup, data-storage behavior, catalog source links, and image fallback.
- [x] Verify empty stock, zero stock, missing image, no-result filters, small screens, and reduced-motion styling.
- [x] Run `npm test -- --run` and `npm run build`.
