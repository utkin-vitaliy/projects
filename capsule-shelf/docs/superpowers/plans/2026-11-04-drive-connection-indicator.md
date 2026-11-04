# Google Drive Connection Indicator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Keep the Google Drive account linked across page reloads and expose sync control as a compact circular icon in the page header.

**Architecture:** Store only remembered account identity in localStorage and require an explicit user gesture to reacquire Google access after reload. Move connection state and disconnect access into an accessible header control with localized labels and reduced-motion handling.

**Tech Stack:** React, TypeScript, CSS, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-04-drive-connection-indicator.md`

## Global Constraints

- Keep the site static and use the existing Google Drive `appDataFolder` JSON.
- Never persist OAuth access tokens.
- Do not ship nonfunctional Apple or GitHub provider buttons.
- Keep the existing account-specific settings namespace and conflict dialog behavior.

## Review Focus

- Reload with a remembered account: settings must load from that account namespace without falsely claiming an active token session.
- Disconnect: remembered identity must be removed and the control must become disconnected.
- Token failure or Drive read failure: show an error state, preserve local settings, and allow retry.
- Syncing under reduced motion: convey progress textually without continuous rotation.
- Narrow viewport and keyboard use: header control remains reachable, focus-visible, and its popover stays within the viewport.

---

### Task 1: Remember account identity safely

**Files:**
- Create: `src/storage/rememberedGoogleAccount.ts`
- Create: `src/storage/rememberedGoogleAccount.test.ts`
- Modify: `src/App.tsx`
- Test: `src/App.test.tsx`

- [ ] Write tests for valid save/read, malformed stored data, and clearing the remembered account; confirm the tests fail.
- [ ] Implement the typed localStorage helper without any token fields; run its tests.
- [ ] Use remembered identity to initialize the account-specific settings namespace. Write identity only after Drive connection succeeds and clear it on disconnect.
- [ ] Add an app-level reload test that confirms the remembered account state remains without storing an access token.
- [ ] Run the focused and full test suites.

### Task 2: Header sync control

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/i18n/locale.tsx`
- Modify: `src/styles.css`
- Test: `src/App.test.tsx`

- [ ] Write failing UI tests for the header control, status states, and disconnect popover.
- [ ] Move the Google Drive control from the footer into the header to the left of language buttons. Use neutral, linked, syncing, remembered, and error variants; provide localized accessible labels and tooltip text.
- [ ] Add a compact connected-state popover with status and an explicit disconnect button; close it on Escape and outside interaction.
- [ ] Animate the arrow glyph only while syncing and disable that animation under `prefers-reduced-motion`.
- [ ] Run the full test suite and production build; inspect the local page at desktop and mobile widths.
