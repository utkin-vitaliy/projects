# Capsule Shelf File Storage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist Capsule Shelf quantities, favorites, thresholds, and notes in a local JSON file instead of routinely using browser localStorage.

**Architecture:** A loopback-only Node HTTP API validates and atomically writes `data/inventory.json`. A process supervisor starts the API and Vite together, with Vite proxying `/api`. React hydrates asynchronously through a fetch adapter and migrates the existing version-1 localStorage record once only when the file does not exist.

**Tech Stack:** React, TypeScript, Vite, Node.js built-in `http`/`fs`, Vitest, Node `node:test`, React Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-03-capsule-shelf-file-storage-design.md`.

## Global Constraints

- Store data at `data/inventory.json`; ignore the file and temporary writes in Git.
- Bind API only to `127.0.0.1`; expose only inventory GET and PUT operations.
- Validate version-1 payloads and atomically replace data using temp-file-plus-rename.
- Migrate legacy localStorage only when the JSON file is absent; clear the legacy key only after a successful JSON write.
- Keep the app usable in memory on storage errors and show an accurate unsaved-data notice.
- Add no web-server framework dependency.

## Review Focus

- Invalid or oversized API input must not replace existing JSON; test validation and previous-file preservation.
- Missing or malformed JSON must not crash startup or be silently overwritten; test file initialization and read errors.
- Failed migration must preserve legacy data; test the write-failure path.
- Async hydration must not overwrite existing data with the initial empty state; test read-before-write behavior.
- File write failure must be visible to the user and not claim persistence; test UI error handling.

---

### Task 1: Local inventory API and development runner

**Files:**
- Create: `server/inventoryStore.mjs`
- Create: `server/inventoryApi.mjs`
- Create: `server/inventoryApi.node-test.mjs`
- Create: `scripts/dev.mjs`
- Modify: `vite.config.ts`
- Modify: `package.json`
- Modify: `.gitignore`

**Interfaces:**
- `createInventoryServer({ filePath }) -> http.Server` serves `GET /api/inventory` and `PUT /api/inventory`.
- GET returns `{ exists: false }` or `{ exists: true, version: 1, inventory }`.
- PUT accepts `{ version: 1, inventory }`, returns `{ ok: true }`, HTTP 400 for invalid JSON/schema, and HTTP 500 for filesystem failures.
- `npm run dev` starts API on `127.0.0.1:3001` and Vite; Vite proxies `/api` to the API; SIGINT/SIGTERM stops both.

- [x] Write Node tests for missing file, GET/PUT round-trip, invalid schema/counts/notes, malformed/oversized requests, malformed existing file, and preserving existing file after rejected writes.
- [x] Run `node --test server/inventoryApi.node-test.mjs` and confirm expected failures.
- [x] Implement request parsing with a 1 MiB body limit, schema validation, and atomic sibling temp-file rename.
- [x] Implement dev process supervision, Vite proxy, `.gitignore` rules, and `npm run test:api`.
- [x] Run `node --test server/inventoryApi.node-test.mjs`; confirm all tests pass.
- [x] Commit `feat: add local JSON inventory API`.

### Task 2: Async persistence and legacy migration

**Files:**
- Create: `src/storage/inventoryApi.ts`
- Modify: `src/storage/inventoryStorage.ts`
- Modify: `src/storage/inventoryStorage.test.ts`
- Modify: `src/features/inventory/useInventory.ts`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

**Interfaces:**
- `readInventory(): Promise<{ exists: boolean; inventory: InventoryState }>` uses GET.
- `writeInventory(inventory: InventoryState): Promise<void>` uses PUT and rejects non-success responses.
- `loadInventory(catalog, raw): InventoryState` is a pure legacy-payload parser; it has no `window.localStorage` access.
- `useInventory()` exposes `ready` and `storageNotice`; persistence writes are disabled until initial hydration completes.

- [x] Add failing tests for hydration, creating a missing JSON file, preserving all legacy entry fields, clearing localStorage only after successful migration, ignoring legacy state when the file exists, and load/save failures.
- [x] Run focused Vitest tests and confirm the new expectations fail.
- [x] Implement the API adapter, pure legacy parser, async hydration, migration, and save error reporting.
- [x] Run focused Vitest tests; confirm state hydrates before writes and migration failure preserves the old key.
- [x] Commit `feat: persist capsule inventory to JSON file`.

### Task 3: Documentation and storage verification

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-11-03-file-storage-and-current-catalog-design.md`

- [x] Document JSON location, local-only API, migration, backup, startup, and recovery from unavailable storage.
- [x] Run `npm test -- --run`, `npm run test:api`, `npm run build`, and `git diff --check`.
- [x] Run a loopback API smoke check and browser reload check for persisted quantity and notes.
- [x] Commit `docs: explain local inventory file storage`.

## Self-review

- The API owns file format validation and atomic writes; client code owns hydration and one-time migration; the hook owns user-visible status.
- Missing file, invalid data, network errors, and migration safety each have an owning test.
- This plan does not alter the Nespresso catalog; catalog work has a separate plan.
