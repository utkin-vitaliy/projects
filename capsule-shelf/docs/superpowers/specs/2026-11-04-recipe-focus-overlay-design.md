# Recipe focus overlay

## Intent

Let users read one recipe comfortably without losing their place in the recipe list. Open the same focused view when a user clicks a recipe card or follows a recipe link from a capsule.

## Goals

- Animate the selected recipe card into a larger, centered panel above a dimmed page.
- Preserve the existing deep link from a capsule and open the linked recipe in the focused view.
- Keep recipe text, ingredients, method, favorite control, and source link readable and usable.
- Close with a visible close button, Escape, or clicking the dimmed backdrop; restore the previous page position and focus.
- On short or narrow screens, constrain the panel to the viewport and allow the recipe content to scroll inside it.

## Non-goals

- No route or data model changes.
- No changes to recipe content or search/filter behavior.

## Approaches considered

1. **Centered overlay (selected):** one enlarged card above a dim backdrop. Works consistently for both card clicks and capsule deep links, with minimal disruption to the list.
2. **In-place enlargement:** grows the card inside the grid. Keeps page context but cannot reliably center a target reached from another view and leaves the rest of the page visually busy.

## Implementation calls

- Clicking a recipe card opens the overlay; interactive controls and links inside the card retain their normal actions.
- The overlay uses a subtle scale/fade transition and a translucent dark backdrop.
- The selected recipe is centered when it fits; if taller than the available viewport, the panel scrolls internally.
- The selected card remains addressable by its existing `#recipe-<id>` target; the overlay state itself does not need a new URL format.
