# Nespresso recipe book selections for Original Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add eleven translated, clearly adapted recipes from Nespresso's professional recipe book to the Original recipe page.

**Architecture:** Extend the existing recipe data with optional adaptation notes and official source-page links. Store drink-photo crops under `public/recipe-book/` and render them using the existing responsive card style.

**Tech Stack:** React, TypeScript, Vitest, Vite, Poppler, ImageMagick.

**Spec:** `docs/superpowers/specs/2026-11-03-recipebook-original-design.md`

## Global Constraints

- All entries presented in the app remain for Original.
- Every substitution for a Professional-only capsule is identified as an adaptation.
- Recipe text is in Russian and quantities follow the provided book.
- No new dependencies.

## Review Focus

- Professional substitutions must be visibly identified; assert all adapted entries have adaptation notes.
- New image assets must load; assert the rendered images use local paths.
- New links must point to the official Nespresso-hosted recipe book at the right page.
- Existing twelve recipes and their source links must remain.
- Long page count must remain dynamically stated rather than hard-coded.

---

### Task 1: Add recipe book entries and adaptation metadata

**Files:**
- Modify: `src/data/recipes.ts`
- Modify: `src/data/recipes.test.ts`
- Modify: `src/components/RecipesPage.tsx`
- Modify: `src/components/RecipesPage.test.tsx`

- [x] Add failing tests for eleven translated recipe entries, source pages, and marked substitutions.
- [x] Run targeted tests and confirm expected failures.
- [x] Add the eleven entries with source links to the official PDF and display adaptation notes.
- [x] Run targeted tests and confirm they pass.

### Task 2: Add recipe book photography

**Files:**
- Create: `public/recipe-book/*.jpg` (eleven crops)
- Modify: `src/data/recipes.ts`
- Modify: `src/data/recipes.test.ts`

- [x] Render the eleven source pages and crop each featured drink from the supplied PDF.
- [x] Point the eleven book entries to their local images and add Russian alt text.
- [x] Confirm local image assets are served by the preview and review the recipe crops.

### Task 3: Verify integration

**Files:**
- Modify: `src/components/RecipesPage.tsx`
- Modify: `src/components/RecipesPage.test.tsx`

- [x] Make the recipe count reflect the current dataset length.
- [x] Run all tests, production build, and `git diff --check`.
