# Capsule Shelf File Storage Design

This is the storage sub-project from the approved [combined Capsule Shelf design](2026-11-03-file-storage-and-current-catalog-design.md); it does not change the approved scope.

## Intent and goals

Save inventory counts, favorites, low-stock thresholds, and personal tasting notes automatically to a readable local JSON file instead of routinely using browser localStorage.

## Chosen approach

Use a small Node HTTP API bound to `127.0.0.1`, with the data file at `data/inventory.json`. Start it with Vite through the existing `npm run dev` entry point and proxy `/api` requests. Validate payloads and replace the file atomically using a temporary sibling file and rename. Avoid adding a server framework dependency.

## Migration and failure behavior

If the data file does not exist, import the browser's current `capsule-shelf:inventory:v1` value once, preserving quantities, favorites, thresholds, and notes. Remove that legacy key only after the JSON file has been saved successfully. If the file exists, use it as the source of truth and do not read browser storage. Show read/write failures visibly, keep the UI usable in memory, and never report unsaved data as persisted.

## Non-goals and constraints

- No accounts, cloud sync, remote notifications, or general-purpose file API.
- No routine localStorage reads or writes after migration.
- Keep the data file out of Git; users can back it up as ordinary JSON.
- The file store preserves records for catalog items that are later removed.

## Acceptance checks

- Data survives reloads and server restarts.
- Failed migration does not clear browser data; failed writes do not corrupt the previous JSON file.
- Async startup never overwrites an existing file with initial empty state.
- Invalid payloads and corrupt JSON do not crash the page or silently overwrite data.
