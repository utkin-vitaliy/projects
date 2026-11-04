# GitHub Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the Node inventory service and prepare Capsule Shelf for static GitHub Pages deployment.

**Architecture:** Vite serves and builds the React app directly. User data remains in browser localStorage with legacy v1 migration and explicit JSON import/export. GitHub Actions builds `dist` and deploys it through GitHub Pages.

**Tech Stack:** React, TypeScript, Vite, Vitest, GitHub Actions, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-11-03-github-pages-design.md`

## Global Constraints

- Never commit personal inventory data.
- Do not change the GitHub repository visibility as part of this code change.
- The published Pages site is public; the current repository is private.
- Preserve browser import/export and one-time migration from `capsule-shelf:inventory:v1`.

## Review Focus

- First run with v1 local data migrates it once into v2 and retains archived IDs.
- Existing v2 data always takes precedence over v1.
- GitHub Pages project base path applies to assets, while local development remains at `/`.
- Workflow permissions are limited to Pages deployment requirements.
- The checked-in repository contains no personal inventory JSON.

---

### Task 1: Browser-only persistence

**Files:**
- Modify: `src/features/inventory/useInventory.ts`
- Modify: `src/App.test.tsx`

**Interfaces:**
- Consumes: `loadInventory`, `parseInventoryBackup`, and `serializeInventory` from `src/storage/inventoryStorage.ts`.
- Produces: inventory hydration and debounced writes using only `capsule-shelf:inventory:v2`; fallback to v1 localStorage on first run.

- [ ] Remove the server JSON read and keep the v1 localStorage fallback.
- [ ] Update app tests to assert browser storage persistence, migration, reload, notes, and archived record retention.
- [ ] Run `npm test -- --run` and confirm all app tests pass.

### Task 2: Remove the runtime server

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Modify: `README.md`
- Delete: `scripts/dev.mjs`
- Delete: `server/inventoryApi.mjs`
- Delete: `server/inventoryStore.mjs`
- Delete: `server/inventoryApi.node-test.mjs`
- Delete: `src/storage/inventoryApi.ts`
- Delete: `src/storage/inventoryApi.test.ts`

**Interfaces:**
- Consumes: Task 1 browser-only persistence.
- Produces: `npm run dev` starts Vite only; no `/api` proxy or Node server dependency remains.

- [ ] Remove server scripts, API adapter, proxy, and API tests.
- [ ] Rewrite README around static local development and browser data.
- [ ] Run `npm test -- --run` and `npm run build`.

### Task 3: GitHub Pages build and deployment

**Files:**
- Modify: `vite.config.ts`
- Create: `.github/workflows/pages.yml`
- Modify: `README.md`

**Interfaces:**
- Consumes: Vite app and build command from Task 2.
- Produces: project-aware `base` path and a workflow that builds and deploys `dist` to Pages.

- [ ] Derive the Pages base from `GITHUB_REPOSITORY` when `GITHUB_ACTIONS` is true; keep `/` for local usage.
- [ ] Add a workflow on pushes to `main` and manual dispatch, with read/content and Pages/id-token permissions, then upload and deploy the `dist` artifact.
- [ ] Document that Pages requires repository settings to use GitHub Actions and that the public website exposes no user inventory.
- [ ] Run the full test suite, production build, and `git diff --check`.
