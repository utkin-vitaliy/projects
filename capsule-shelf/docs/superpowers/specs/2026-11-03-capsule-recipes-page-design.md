# CapsuleShelf recipe page — design

## Intent

Add a second, Russian-language view to CapsuleShelf so the user can quickly choose a Nespresso drink and follow a clear recipe alongside capsule inventory.

## Goals

- Add simple in-app navigation between “Капсулы” and “Рецепты”.
- Show five concise recipe cards: Cappuccino, Flat White, Iced Latte, Latte Macchiato, and Maple Pecan Cappuccino.
- Include prep time, difficulty when provided by Nespresso, ingredients, Russian-language steps, the compatible Original capsule or choice of capsules, and a direct official source link on each card.
- Keep the page responsive and consistent with CapsuleShelf’s existing warm, minimal visual style.

## Non-goals and anti-goals

- No recipe editor, favorites, search, filters, external API, or backend persistence in this change.
- Do not include Vertuo-only recipes in the Original capsule collection.
- Do not describe the selection as an official popularity ranking; Nespresso Canada does not expose one in its recipe catalogue. This is a small curated set of recognizable coffee styles.
- Do not copy the source descriptions verbatim; translate factual ingredients and summarize preparation steps in Russian.

## Approaches

1. In-app view switch inside the existing React application, using the current styling and no routing dependency. This is small and preserves the existing app flow. **Selected.**
2. Add a URL route and routing dependency for `/recipes`. This makes direct links easier but adds setup and dependency weight for a small static library.

## Content and sources

- Cappuccino: 1 Original espresso capsule (40 ml), 50–70 ml cold milk; sugar and cocoa to taste. Nespresso Canada recipe PDF: https://www.nespresso.com/ncp/res/generated/recipes/015CAP_en_CA.pdf
- Flat White: Volluto, 100 ml cold 2.5% milk, 4 g sugar; brew a 40 ml espresso and top with milk foam. https://www.nespresso.com/recipes/ca/en/23075FLA-flat-white.html
- Iced Latte: a compatible Original espresso, 50–60 ml milk, ice; pour coffee slowly over cold milk and ice. https://www.nespresso.com/ncp/res/generated/recipes/287ICE_en_CA.pdf
- Latte Macchiato: 1 Original espresso capsule (40 ml), 100–120 ml cold milk; layer frothed milk and coffee. https://www.nespresso.com/ncp/res/generated/recipes/073LAT_en_CA.pdf
- Maple Pecan Cappuccino: Arpeggio, 100 ml milk, 5 ml maple syrup, 5 ml butter, 2 pecans; froth the maple milk, combine with buttered pecans, then add the coffee and garnish. https://www.nespresso.com/ncp/res/generated/recipes/37093MAP_en_CA.pdf

The sources are official Nespresso Canada recipe pages/PDFs. The original catalogue groups recipes by style, including iced coffee, cappuccino, and latte; it does not supply a popularity sort. The selection is limited to recipes adaptable to or explicitly written for Original capsules.

## Constraints and implementation calls

- The application currently has one React screen and no router; use a small view switch rather than adding a routing package.
- Recipe data is static local content; use semantic HTML for cards, ingredients, and numbered steps.
- Each source opens in a new tab with safe `rel` attributes.
- All displayed recipe text is Russian; capsule names remain in the official product spelling for easy matching with the catalog.
