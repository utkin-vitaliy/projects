# Capsule Shelf Current Catalog Design

This is the catalog sub-project from the approved [combined Capsule Shelf design](2026-11-03-file-storage-and-current-catalog-design.md); it does not change the approved scope.

## Intent and goals

Expand the 11-product starter list to a deduplicated snapshot of all individual Nespresso Original coffee varieties currently listed in the Nespresso Canada catalog, including limited editions shown there. Current page content suggests approximately 40 distinct products; the exact count may vary as the site changes.

## Catalog scope

- Include coffees shown in current categories such as limited editions, Italian espressos, decaffeinated, coffee cultures, origins, flavored/milk recipes, and heritage.
- Exclude bundles, capsule assortments, advent calendars, machines, accessories, syrups, and other non-coffee items.
- Preserve all existing product IDs and personal inventory links.
- Keep product metadata and official image URLs in source; link each item to its Nespresso Canada product page and retain the existing image fallback.
- Repeated placements of the same variety across site sections become one product.

## Chosen approach

Maintain a manual catalog snapshot. Add typed categories and a category selector that composes with the existing all/favorites/low-stock filters. Do not scrape or synchronize the site at runtime.

## Non-goals

- No Vertuo catalog, dynamic Nespresso API integration, price/stock tracking, or automated updates.
- Do not delete old inventory JSON records if an item later disappears from the catalog.

## Acceptance checks

- Every distinct individual coffee in the captured page appears once with a stable ID, official image and matching source link.
- Existing 11 products retain their IDs; old notes and quantities remain associated with those IDs.
- Category filtering composes with favorites and low-stock filters; broken images leave cards usable.
