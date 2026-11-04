# Google Drive Settings Sync

## Intent

Let Capsule Shelf users carry their settings between devices without adding an application server. The static site uses Google OAuth in the browser and stores one private JSON file in each user's Google Drive `appDataFolder`. Apple CloudKit is a later extension, not part of this release.

## Goals

- Keep GitHub Pages static and call Google Identity Services and Drive API directly from the browser.
- Store inventory quantities, capsule favorites, thresholds, tasting notes, recipe favorites, and selected language together in one versioned JSON file.
- Keep guest mode and browser-local persistence working when Google Drive is not connected.
- On the first connection, create the Drive file from the current browser settings if no cloud file exists.
- If both local and Drive settings exist and differ, ask which copy to keep. Never silently overwrite either copy.
- After connection, save edits locally first and synchronize them to Drive with a short debounce. Show connected, saving, saved, and error states.
- Keep OAuth access tokens in memory only. Do not commit credentials or user data to the repository.
- Keep the existing download/import backup controls, expanded to include the full settings file while continuing to accept the old inventory-only format.

## Non-goals

- Apple sign-in or CloudKit in this release.
- A custom API server, database, or shared account system across Google and Apple.
- Real-time collaborative editing across multiple open devices. The latest completed Drive write wins in v1.
- Storing access or refresh tokens in localStorage.

## Approaches

1. **Google Drive `appDataFolder` JSON (selected):** one hidden app-owned file per Google account, updated directly by the static site using the non-sensitive `drive.appdata` scope. This supports automatic cross-device reads without a server, while users manage access through their Google account.
2. **Visible Drive JSON via `drive.file`:** users can inspect and move the file, but the app needs a file-picker/reselection flow and can lose track if the file is moved or deleted. This is less automatic.
3. **JSON in the GitHub Pages repository:** unsuitable because Pages serves static public files and cannot securely create per-user writes.

## User flows

### Connect

1. The user selects “Connect Google Drive” and chooses a Google account.
2. The browser receives a short-lived access token for the Google user and identifies the account using its stable Google subject ID.
3. The app looks for `capsule-shelf-settings.json` in `appDataFolder`.
4. If absent, upload the current local settings and connect.
5. If present and local settings are empty or match, load the Drive settings. If local settings differ, show a choice to use the device copy or the Drive copy; keep the rejected copy in its existing local cache.

### Save and reconnect

- While connected, persist each change to the account-specific browser cache immediately, then debounce Drive writes.
- If Drive is temporarily unavailable or the access token expires, retain local changes and show an actionable sync error. The user can reconnect to retry.
- After a page reload, require the user to reconnect; access tokens are not persisted. On another device, connecting the same Google account loads the same Drive JSON.
- Disconnect returns the app to the separate guest browser settings; it does not delete the Drive file.

## Settings format

Use a `capsule-shelf-settings` JSON document with `version`, `updatedAt`, `locale`, `inventory`, and `favoriteRecipes`. The inventory map retains the existing shape, including unlisted/retired capsule IDs, quantities, favorites, thresholds, and notes. Readers accept the existing inventory-only backup format and migrate it to the unified shape.

## Configuration and security

- Require a Google OAuth Web client ID exposed as `VITE_GOOGLE_CLIENT_ID`; a client ID is public configuration, not a secret.
- Enable Google Drive API and authorize the production GitHub Pages origin plus localhost for development.
- Request `openid email https://www.googleapis.com/auth/drive.appdata`; do not request broad Drive access.
- Never put a client secret, service-account key, or access token in source files or browser storage.
- Google account state is provider-specific. Apple support later will use CloudKit's private database, not the same Google file.

## Acceptance criteria

- Guest settings continue to work and are not replaced just by opening the site.
- Connecting with a new Google account creates one appDataFolder JSON from that browser's settings.
- Connecting an existing account on a clean browser restores its settings and account language/favorites.
- Local/cloud conflicts require an explicit choice and preserve the other copy.
- Inventory edits, capsule favorites, notes, thresholds, recipe favorites, and language changes sync after debounce.
- An expired token or network failure never discards the local copy and is visible in the UI.
- Legacy inventory-only JSON imports and downloads remain supported.
- Build and all tests pass without requiring live OAuth credentials.
