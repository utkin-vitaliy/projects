# Capsule-to-Recipe Links

## Intent

Help users find recipes that use a capsule from the inventory catalog, then jump directly to that recipe.

## Goals

- Show a compact “Рецепты (N)” control on capsule cards that have matching recipes.
- Expand the control to reveal links named after each matching recipe.
- Include recipes with an explicitly named capsule and recipes marked for any Nespresso Original capsule.
- Selecting a recipe opens the Recipes view and scrolls to and focuses its card.
- Keep capsule cards uncluttered while exposing all matching recipes on demand.

## Non-goals

- Change recipe instructions, catalog contents, filters, or inventory data.
- Add reverse links from recipe cards to inventory cards.

## Approaches

1. Display every recipe link directly on every capsule card. This is immediate but adds repeated text and makes the catalog cards crowded.
2. Add a compact expandable “Рецепты (N)” control, then show links to matching recipes. This keeps the current card layout tidy while still providing a direct jump. **Selected:** the user chose the recommended second approach.
3. Add one generic button that opens the recipe section without selecting a specific recipe. This is simpler but does not provide the requested anchor to a recipe card.

## Behavior and implementation

- Store recipe-to-capsule relationships explicitly using capsule IDs, with a flag for recipes that allow any Original capsule.
- The capsule card shows the expandable control only when at least one recipe matches.
- Each revealed recipe link has a stable recipe-card target ID.
- Because the app switches between conditionally rendered views, a link first selects the Recipes view; after it renders, the app scrolls to the target card and focuses it for keyboard and screen-reader users.
- Keep all state in memory; do not write recipe navigation state to the inventory JSON.

## Verification

- Test matching of named and universal recipes.
- Test that capsule cards expose only their matching recipe links.
- Test that selecting a link opens the recipe view and targets the intended card.
- Run the existing test suite and production build.
