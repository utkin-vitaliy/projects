# Nespresso recipe book selections for Original

## Intent

Add a curated selection from the user-provided seventh-edition Nespresso Professional recipe book to the existing Original-only recipe page, so the user can browse translated drinks without confusing Professional capsules with Original.

## Scope

- Add eleven non-alcoholic recipes: Spiced Cookie Butter Latte, Dark Chocolate Pistachio Latte, Dark Chocolate Peppermint Latte, Campfire Latte, Fig and Honey Latte Macchiato, Shaken Vietnamese Coffee, Iced Caramel Oat Latte, Iced Mocha Mint Latte, Iced Salted Caramel Latte, Pistachio Latte Milkshake, and Sweet Hazelnut Coffee Float.
- Translate titles, ingredient quantities, and preparation steps into Russian.
- Recipes from the book that specify Professional capsules must use a currently listed Canadian Original capsule with a similar flavor profile and carry an explicit adaptation note. Recipes specifying Ristretto remain unchanged.
- Keep all added entries in the current grid and use the existing card style.
- Use a crop of the drink photograph from each user-provided recipe page, packaged as a small local image asset. Link each added card to the official Nespresso-hosted book opened at the cited page.

## Approaches

- Add the entire 103-page book: rejected because it contains Professional-only and alcoholic recipes and would mix systems with the app's Original inventory.
- Add the book as a separate Professional catalog: rejected because the user chose the Original-compatible selection.
- Add a curated Original selection with transparent capsule substitutions: chosen because it preserves the app's system boundary while retaining the book's drink ideas.

## Calls

- Include eleven sweet and cold/hot non-alcoholic drinks; omit the cocktail section.
- Keep original measurements and portions, making no claims that a Professional capsule itself fits an Original machine.
- Make image assets local crops from the attached PDF so the cards remain available without relying on image hotlinks.

## Success checks

- The recipe dataset includes all eleven entries with Russian ingredients/steps, source page numbers, official book links, and explicit adaptation notes where applicable.
- All eleven added images load locally and the existing twelve recipe cards remain unchanged.
- Automated tests and the production build pass.
