# Capsule Shelf: file storage and current catalog

## Intent

Make Capsule Shelf more useful for managing a real collection by saving inventory, favorites, alert thresholds, and tasting notes in a local JSON file, and by showing the individual Nespresso Original coffees currently listed by Nespresso Canada.

## Goals

- Persist changes automatically to a JSON file on the user's computer through a small local Node API.
- Keep the existing inventory and notes when migrating from this browser's current `localStorage`, then stop using browser storage for routine reads/writes.
- Expand the hand-maintained catalog from 11 items to a deduplicated snapshot of roughly 40 individual Original coffee varieties visible on Nespresso Canada's catalog page at implementation time, including currently listed limited editions.
- Preserve product images and direct source links from Nespresso Canada; include intensity where provided.
- Add a compact catalog category filter so the larger collection remains easy to browse.
- Keep inventory, favorite, threshold, and note data local to this computer, with no account or cloud sync.

## Non-goals

- Automatically scrape or synchronize the Nespresso website at runtime.
- Track availability, price, or product changes after the catalog snapshot is added.
- Add Vertuo products, capsule kits/assortments, advent calendars, machines, accessories, or syrups as inventory varieties.
- Add cloud sync, user accounts, or remote notifications.

## Approaches considered

1. **Local Node API backed by JSON file — chosen.** The existing `npm run dev` workflow starts Vite and a small Node server; the browser reads and writes the file through the API. This supports automatic persistence and gives the user a readable, portable file.
2. **Browser File System Access API.** The user selects and grants access to a file in the browser. This avoids a server but depends on browser support and file permission behavior, so it is less reliable for this app's existing workflow.
3. **Manual JSON import/export.** Simple to implement, but every update requires user action and it does not provide the requested automatic persistence.

## Design decisions

- Use Node's built-in HTTP and filesystem modules; avoid adding a web-server dependency.
- Store data at `data/inventory.json` in the project directory and add that file to `.gitignore`.
- Bind the API to `127.0.0.1`. `npm run dev` will manage the API and Vite processes together; Vite will proxy `/api` requests to the local API.
- The API exposes only inventory read/write operations. It validates the versioned payload, writes a temporary file, then renames it over the data file so an interrupted write does not leave partial JSON.
- The dev runner launches the loopback API and Vite together; the browser accesses only the same-origin `/api` proxy.
- On first launch with no JSON file, the client may migrate the existing `capsule-shelf:inventory:v1` record once. It clears that browser record only after the file save succeeds. If a JSON file already exists, it is authoritative and browser storage is not read.
- The client waits for API hydration before displaying inventory controls and does not issue an initial empty write over existing data.
- The catalog is a manually maintained snapshot of distinct individual coffee products shown in the Nespresso Canada Original catalog page at implementation time. Repeated listings across page sections become one product. Limited editions currently listed are included; kits, assortments, bundles, advent calendars, and non-coffee products are excluded.
- The captured catalog has 40 unique individual varieties as of November 3, 2026. Source: https://www.nespresso.com/ca/en/order/capsules/original. Product listings include official product page and image URLs; the inventory app does not synchronize with the site.
- Catalog categories follow the site's coffee groupings where practical (limited editions, Italian espressos, decaffeinated, coffee cultures, origins, flavored/milk recipes, heritage). Category filtering is additive to existing all/favorites/low-stock filtering.
- Catalog product metadata and image URLs remain in source code; inventory quantities and personal notes remain in the local JSON file.
- Product images preserve their native square proportions in a taller portrait display area so the full capsule silhouette stays visible. Stock quantities use a directly editable non-negative integer field and save on blur or Enter; adjacent plus/minus controls adjust the value by one, with decrement disabled at zero.
- Storage errors remain visible in the UI; the app stays usable in memory for the current session and does not silently claim that data was saved.

## Acceptance checks

- A fresh install creates and uses `data/inventory.json`; edits survive page reloads and server restarts.
- Existing localStorage inventory is migrated once without losing quantities, favorites, thresholds, or notes, and the legacy key is cleared only after successful file persistence.
- Malformed or unsupported JSON is handled visibly without corrupting or silently overwriting the file.
- The catalog contains each distinct individual coffee product from the captured Nespresso Canada page once, with working source links and image fallback.
- Existing inventory behavior, notes, filtering, threshold alerts, accessibility labels, and reduced-motion styles continue to work.
- Tests, production build, API checks, and a browser smoke check pass.

## Open implementation choices

- Use the current site's individual coffee products and categories as they appear at implementation time; because the site changes seasonally, the exact count may differ slightly from 40.
- Keep the file readable JSON with stable product IDs. If a catalog item is removed later, keep its saved inventory record on disk but hide it from the current catalog rather than deleting it.
