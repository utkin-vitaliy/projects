# Google Drive Settings Sync Implementation Plan

> **For agentic workers:** Implement inline, task by task, with TDD. Do not publish or push; the user wants to review a local preview first.

**Goal:** Add account-scoped settings sync for the static Capsule Shelf site using one JSON file per Google account in Drive `appDataFolder`.

**Architecture:** Keep the site static. Use Google Identity Services in the browser for short-lived OAuth access tokens and the Drive REST API for one private settings JSON. Keep guest and Google account browser caches isolated; autosave to Drive after local persistence. CloudKit is explicitly out of scope.

**Tech Stack:** Existing React, TypeScript, Vite, Vitest, GitHub Pages, Google Identity Services OAuth token model, Google Drive API v3.

**Spec:** `capsule-shelf/docs/superpowers/specs/2026-11-04-google-drive-settings-sync.md`

## Global Constraints

- No custom application server, database, refresh token, client secret, or service-account key.
- Request only `openid email https://www.googleapis.com/auth/drive.appdata`.
- Keep access tokens in memory only.
- The Drive document includes inventory, capsule favorites, thresholds, notes, recipe favorites, and locale.
- Keep the guest cache and every Google account cache separate.
- Preserve the old inventory-only import format and keep manual download/import available.
- Do not push or publish; provide a local preview for review.

## Review Focus

- Google OAuth blocked or missing client ID → show a clear setup/sync error; local edits remain available.
- Multiple Google accounts on one browser → never show or overwrite another account's cache after switching.
- Drive file missing on first connection → upload current settings once; do not replace them with an empty default.
- Device copy and Drive copy differ → ask the user which copy to keep, preserving the other local cache.
- Offline or expired access token during autosave → keep local settings and expose retry/reconnect.

---

### Task 1: Unified settings document

**Files:**
- Create: `capsule-shelf/src/storage/userSettings.ts`
- Test: `capsule-shelf/src/storage/userSettings.test.ts`

**Interface:** `UserSettings = { format: "capsule-shelf-user-settings"; version: 1; updatedAt: string; locale: Locale; inventory: InventoryState; favoriteRecipes: string[] }`; export `serializeUserSettings(settings)` and `parseUserSettings(raw, catalog, recipeIds)`.

- [ ] Write tests for round-trip, invalid JSON/version, invalid locale/recipe IDs, and migration of the existing inventory-only JSON.
- [ ] Run `npm test -- --run src/storage/userSettings.test.ts`; expect failures because the module is missing.
- [ ] Implement validation and normalization by reusing `parseInventoryBackup`.
- [ ] Re-run the focused test, then all tests.

### Task 2: Google Drive client

**Files:**
- Create: `capsule-shelf/src/storage/googleDrive.ts`
- Test: `capsule-shelf/src/storage/googleDrive.test.ts`
- Modify: `capsule-shelf/src/vite-env.d.ts` or the project's existing Vite type declarations.

**Interface:** `loadGoogleIdentityLibrary()`, `requestGoogleAccessToken(clientId)`, `getGoogleAccount(accessToken)`, `readDriveSettings(accessToken)`, and `writeDriveSettings(accessToken, settings, fileId?)`. Inject `fetch` for tests; never persist tokens.

- [ ] Write tests for the exact least-privilege scope, account discovery, missing-file result, read, create, update, malformed response, 401, and HTTP errors.
- [ ] Run the focused test; confirm it fails before production code.
- [ ] Implement GIS token access, userinfo lookup, `appDataFolder` list/download, and media create/update.
- [ ] Re-run focused tests and the full suite.

### Task 3: Account-scoped browser settings

**Files:**
- Modify: `capsule-shelf/src/features/inventory/useInventory.ts`
- Modify: `capsule-shelf/src/components/RecipesPage.tsx`
- Modify: `capsule-shelf/src/i18n/locale.tsx`
- Create or modify focused tests beside these files.

- [ ] Add a storage namespace parameter to inventory hydration/persistence; keep the current keys as guest keys and use a distinct key for each Google `sub`.
- [ ] Make recipe favorites controlled by `App` and persist them under the same namespace.
- [ ] Let `LocaleProvider` load/persist per namespace and reload the account's saved locale on account change.
- [ ] Write regression tests showing guest state is unchanged when account state is loaded, and two account namespaces cannot read each other's data.
- [ ] Run targeted tests and then the full suite.

### Task 4: Connect, conflict choice, and sync UI

**Files:**
- Modify: `capsule-shelf/src/App.tsx`
- Modify: `capsule-shelf/src/i18n/locale.tsx`
- Modify: `capsule-shelf/src/styles.css`
- Modify: `capsule-shelf/src/App.test.tsx`

- [ ] Add failing tests for connecting with a missing cloud file, loading an existing file, choosing local vs Drive on conflict, account switching, debounced autosave, reconnect errors, and disconnecting back to guest data.
- [ ] Implement a compact localized Drive control in the footer: connect, account identity, syncing/saved/error states, reconnect, and disconnect.
- [ ] Keep local writes immediate; debounce Drive sync and preserve local data on network/token errors.
- [ ] Expand import/export to the unified settings format while retaining legacy import.
- [ ] Run focused tests and full suite.

### Task 5: Deployment configuration and review

**Files:**
- Modify: `/.github/workflows/pages.yml`
- Create: `capsule-shelf/.env.example`
- Modify: `capsule-shelf/README.md`

- [ ] Pass the public `VITE_GOOGLE_CLIENT_ID` repository variable into the Pages build; do not add a secret to the repository.
- [ ] Document Google Cloud setup: enable Drive API, create a Web OAuth client, authorize `http://localhost:5175` and the GitHub Pages origin, and add the client ID as a repository variable.
- [ ] Run `npm run build`, `npm test -- --run`, and `git diff --check` from `capsule-shelf`.
- [ ] Run the local preview on port 5175 and verify the guest UI plus all three locales.
- [ ] Leave changes local for user review; do not commit or push.
