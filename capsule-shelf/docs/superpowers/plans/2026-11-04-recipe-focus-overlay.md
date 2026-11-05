# Recipe Focus Overlay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Open a clicked or capsule-linked recipe in a centered enlarged overlay above the dimmed page.

**Architecture:** Keep the selected recipe card as the same DOM article and promote it to a fixed dialog with a backdrop, preserving its grid slot while open. `RecipesPage` owns card-click and dialog state; `App` passes its existing pending recipe ID into the page so capsule links use the same flow.

**Tech Stack:** React, TypeScript, CSS, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-04-recipe-focus-overlay-design.md`

## Global Constraints

- Preserve the existing capsule-to-recipe navigation and `#recipe-<id>` target IDs.
- Preserve recipe favorite and source-link actions.
- Keep long dialogs within viewport height and internally scrollable.
- Close on button, Escape, or backdrop click; restore prior scroll and focus.
- No route or recipe data changes.

## Review Focus

- Clicks on favorite and source controls must not open the overlay; test event isolation.
- Deep-linked IDs must open only after recipe view renders; test from App.
- Escape and backdrop close must restore focus/scroll; test close paths.
- A filtered-out or invalid pending ID must not create an empty dialog; test guard behavior.
- Reduced-motion users must not receive forced motion; retain CSS reduced-motion support.

### Task 1: Recipe card overlay behavior

**Files:** `capsule-shelf/src/components/RecipesPage.tsx`, `capsule-shelf/src/components/RecipesPage.test.tsx`, `capsule-shelf/src/i18n/locale.tsx`, `capsule-shelf/src/styles.css`

- [x] Add failing tests for opening by click, closing by Escape/backdrop/close button, preserving favorite/source actions, and localized close label.
- [x] Run focused tests and confirm they fail for missing focus behavior.
- [x] Implement focus state, centered dialog/backdrop, card placeholder, animation, scroll lock and restoration.
- [x] Run focused tests and confirm they pass.

### Task 2: Capsule deep-link integration

**Files:** `capsule-shelf/src/App.tsx`, `capsule-shelf/src/App.test.tsx`

- [x] Add a failing App test asserting a capsule-linked recipe opens as a modal dialog.
- [x] Run the test and confirm failure.
- [x] Pass pending recipe ID and its clear callback into `RecipesPage`; replace focus-only scrolling with dialog activation.
- [x] Run App and focused component tests.

### Task 3: Verification

- [x] Run all tests and production build.
- [x] Inspect local UI at desktop and narrow viewport for overlay centering, legibility, close behavior, and scroll restoration.
