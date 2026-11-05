# Vertuo Capsule Catalog

## Goal

Make the Vertuo system selectable as a working capsule inventory in Capsule Shelf while preserving Original data and Google Drive sync.

## Product scope

- Include individual Vertuo capsule products currently presented for purchase in Nespresso Canada’s Vertuo capsule catalog: Nespresso varieties, limited editions, flavored and decaffeinated coffees, Starbucks by Nespresso, and Blue Bottle collaborations.
- Exclude mixed sleeves, discovery sets, subscription offers, machines, accessories, and other non-capsule products.
- Use the Canadian product page as the product source and link each entry to its Canadian page.
- Store names, cup volume, intensity when listed, flavor notes, category, source URL, and a locally bundled product image when an official product image is available.
- Do not include price or stock availability; these are volatile and are not needed for personal inventory.
- Recipes remain Original-only. The Recipes view remains a localized coming-soon state while Vertuo is selected.

## Behavior

- The existing Original/Vertuo selector controls which capsule catalog is visible.
- Switching systems preserves each system’s quantities, favorites, low-stock thresholds, and personal notes. IDs for all Vertuo entries use the `vertuo-` prefix to keep inventory records distinct.
- The inventory summary, search, category filters, favorites, low-stock filter, and category count operate on the selected system’s catalog only.
- Existing Original behavior and data remain unchanged.
- Settings store both systems’ inventory in the existing user-settings JSON, so local persistence and Google Drive sync continue to work across devices. Existing JSON without Vertuo entries remains valid; missing settings default to empty Vertuo stock.
- Catalog copy is available in English, Russian, and French. Capsule names stay in their official form; flavor notes and cup size are localized.

## Visual treatment

- Reuse current capsule card, inventory, filter, and summary styles.
- Show the cup size as a compact product attribute on Vertuo capsule cards.
- Keep official product art contained within the existing image frame.

## Data source

- Nespresso Canada Vertuo capsule catalog: <https://www.nespresso.com/ca/en/order/capsules/vertuo>
- Individual source links are recorded on each catalog entry.

## Out of scope

- Vertuo recipe content.
- Current prices, promotions, purchase actions, and live availability.
- Automatic catalog crawling or refresh at runtime.
