# Vertuo recipe catalog

## Goal

Add Nespresso Vertuo recipes to Capsule Shelf while keeping the existing Original recipe experience intact. The selected capsule system determines which recipes are shown.

## Recipe selection and sources

- Review the Nespresso Canada recipes listing, its individual Canadian recipe pages, and Nespresso-hosted recipe PDFs used for the Original catalog.
- Add a recipe only when Nespresso's source explicitly identifies Vertuo through its capsule, machine, or extraction instructions.
- Add it only when the specifically recommended capsule is present in the current Canadian Vertuo capsule catalog. Do not adapt Original or Professional recipes and do not infer system compatibility from a drink name or image.
- Keep each source URL with its recipe. Translate title, capsule name, ingredients, and steps into Russian, English, and French.
- Store recipe images locally from the corresponding official Nespresso material so the cards do not depend on remote hotlinks.

## Application behavior

- Keep one Recipes page and the existing card design, search, hot/cold filters, favorites, and localized controls.
- Pass the selected system into the Recipes page and filter the shared recipe catalog by system. Filter counts and search results reflect only the selected system.
- Extend the recipe data model to support both Original and Vertuo; keep existing Original records and behavior unchanged.
- Link Vertuo capsule cards to recipes that name those capsules. Recipe-to-capsule matching uses Vertuo catalog IDs, so an Original capsule cannot surface a Vertuo recipe and vice versa.
- Retain the existing recipe-favorites storage format and behavior; favorite IDs remain unique across both systems.
- Replace the Vertuo Recipes placeholder with the Vertuo recipe cards. Keep empty and filter states localized.

## Boundaries

- Do not change capsule inventory, catalog details, stock thresholds, or the Google Drive sync model as part of this feature.
- Do not add generic or guessed recipes. A recipe with no explicit Vertuo evidence or no current Canadian Vertuo capsule match stays out of the catalog.
- Do not modify recipe content belonging to Original.

## Validation

- Tests verify system-specific recipe filtering, count/search/favorite behavior, Vertuo capsule links, and no cross-system recipe leakage.
- Tests verify all Vertuo translations and the source and local image URL for each new recipe.
- Run the full test suite and production build, then inspect the local Vertuo Recipes view and at least one linked capsule card.

## Official source examples

- Nespresso Canada recipe listing: <https://www.nespresso.com/ca/en/recipes>
- Black Iced recipe (Ice Forte, 230 ml): <https://www.nespresso.com/ca/en/recipe?id=black-iced>
- Golden Maple Pecan Reverso recipe (Maple Pecan, Vertuo Coffee Creations mode): <https://www.nespresso.com/ca/en/recipe?id=golden-maple-pecan-reverso>
- Espresso Macchiato Lime & Basil | Vertuo: <https://www.nespresso.com/ca/en/recipe?id=espresso-macchiato-lime-basil-vertuo>
- Official Nespresso Canada Vertuo recipe PDF: <https://www.nespresso.com/ncp/res/generated/recipes/37098MAP_en_CA.pdf>
