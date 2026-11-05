import type { CoffeeSystem } from "../storage/userSettings";

type RecipeReference = readonly [id: string, system: CoffeeSystem, capsuleIds: readonly string[], allOriginal?: true];

// This intentionally contains only stable IDs and capsule relationships. Full recipe
// copy, ingredients, images, and localized text stay in the lazily loaded recipe view.
const recipeReferences: readonly RecipeReference[] = [
  ["cappuccino", "original", [], true], ["flat-white", "original", ["volluto"]], ["iced-latte", "original", [], true], ["latte-macchiato", "original", [], true],
  ["maple-pecan-cappuccino", "original", ["arpeggio"]], ["mocha-latte", "original", ["livanto"]], ["muesli-coffee", "original", ["capriccio", "arpeggio-decaffeinato"]], ["iced-cappuccino", "original", ["ristretto", "roma", "arpeggio", "arpeggio-decaffeinato"]],
  ["iced-chocolate-coffee", "original", ["kazaar"]], ["nespresso-on-ice", "original", ["arpeggio", "ristretto", "arpeggio-decaffeinato", "ristretto-decaffeinato"]], ["cafe-con-hielo", "original", ["ristretto-decaffeinato"]], ["espresso-on-ice-macchiato", "original", ["arpeggio", "cosi", "ristretto", "kazaar"]],
  ["spiced-cookie-butter-latte", "original", ["arpeggio"]], ["dark-chocolate-pistachio-latte", "original", ["ristretto"]], ["dark-chocolate-peppermint-latte", "original", ["ristretto"]], ["campfire-latte", "original", ["ristretto"]], ["fig-and-honey-latte-macchiato", "original", ["ristretto"]],
  ["shaken-vietnamese-coffee", "original", ["athens-freddo-intenso"]], ["iced-caramel-oat-latte", "original", ["cosi"]], ["iced-mocha-mint-latte", "original", ["cosi"]], ["iced-salted-caramel-latte", "original", ["caramello"]], ["pistachio-latte-milkshake", "original", ["ristretto"]],
  ["sweet-hazelnut-coffee-float", "original", ["nocciola"]], ["caramel-iced-latte", "original", ["caramello"]], ["nocciola-lemon-agave-cappuccino", "original", ["nocciola"]], ["caramello-apple-brulee-cappuccino", "original", ["caramello"]], ["dolce-truffle-cappuccino", "original", ["cioccolatino"]],
  ["vaniglia-pumpkin-affogato", "original", ["vaniglia"]], ["rose-pistachio-latte", "original", ["colombia"]], ["eggnog-latte", "original", []], ["coco-cappuccino", "original", ["livanto"]], ["spicy-chocolate-cappuccino", "original", ["indonesia-fairtrade"]],
  ["matcha-latte", "original", ["tokyo-lungo"]], ["miso-caramel-latte", "original", ["napoli"]], ["paris-cafe-gourmandise", "original", ["paris-espresso"]], ["stockholm-spice", "original", ["stockholm-lungo"]], ["miami-espumita", "original", ["miami-espresso"]],
  ["vienna-cream-crown", "original", ["vienna-lungo"]], ["peanut-mocha", "original", ["nicaragua"]], ["fireplace-pumpkin-latte", "original", ["pumpkin-spice-cake"]], ["pumpkin-vietnamese-iced-coffee", "original", ["pumpkin-spice-cake"]], ["mint-and-matcha", "original", ["athens-freddo-intenso"]],
  ["vanilla-coffee-shake", "original", ["athens-freddo-intenso"]], ["affogato-pistachio", "original", ["kazaar"]], ["tiramisu-white-chocolate-strawberry", "original", ["vaniglia"]], ["sparkling-arpeggio-decaffeinato", "original", ["arpeggio-decaffeinato"]], ["almond-butter-banana-latte", "original", ["arpeggio-decaffeinato"]],
  ["pumpkin-spice-cake-affogato", "original", ["pumpkin-spice-cake"]], ["gourmet-almond-croissant-latte", "original", []], ["nespresso-festive-spritz", "original", []], ["sweet-vanilla-strawberry-affogato", "original", ["vaniglia"]], ["iced-pistachio-vanilla-oat-latte", "original", []],
  ["iced-coconut-vanilla-mint-mocktail", "original", []], ["flat-white-over-ice", "original", []], ["tropical-iced-rio", "original", []], ["black-iced", "original", ["athens-freddo-intenso"]], ["cinnamon-cloud-latte", "original", []], ["istanbul-silky-crunch", "original", []],
  ["seaside-breeze-latte", "original", []], ["exotic-coconut-macchiato-over-ice", "original", []], ["festive-vanilla-ice-cream-delight", "original", []], ["nespresso-martini-original", "original", ["arpeggio", "arpeggio-decaffeinato"]], ["nut-latte", "original", ["cape-town-lungo"]],
  ["gourmet-cinnamon-coffee", "original", ["stockholm-lungo"]], ["maple-black-coffee", "original", ["shanghai-lungo", "colombia"]], ["spicy-chocolate-latte", "original", []], ["vanilla-latte-nespresso", "original", ["vaniglia"]],
  ["vertuo-black-iced", "vertuo", ["vertuo-ice-forte"]], ["vertuo-garden-latte", "vertuo", ["vertuo-fortado"]], ["vertuo-fireplace-pumpkin-latte", "vertuo", ["vertuo-pumpkin-spice-cake"]], ["vertuo-maple-cookie-crushed-coffee", "vertuo", ["vertuo-maple-pecan"]],
  ["vertuo-peppermint-mocha", "vertuo", ["vertuo-peppermint-pinwheel"]], ["vertuo-cucumber-lemon-basil-cold-brew", "vertuo", ["vertuo-cold-brew-style-intense"]], ["vertuo-seaside-cream-cold-brew", "vertuo", ["vertuo-cold-brew-style-intense"]], ["vertuo-sweet-vanilla-cardamom-thyme-affogato", "vertuo", ["vertuo-sweet-vanilla"]],
  ["vertuo-maple-black-coffee", "vertuo", ["vertuo-odacio"]], ["vertuo-nut-latte", "vertuo", ["vertuo-intenso"]], ["vertuo-gourmet-cinnamon-coffee", "vertuo", ["vertuo-intenso"]], ["vertuo-red-berries-celebration", "vertuo", ["vertuo-colombia"]],
  ["vertuo-refreshing-citrus-latte", "vertuo", ["vertuo-ice-forte"]], ["vertuo-golden-maple-pecan-reverso", "vertuo", ["vertuo-maple-pecan"]], ["vertuo-glowing-iced-maple-pecan-coffee", "vertuo", ["vertuo-maple-pecan"]], ["vertuo-maple-pecan-latte", "vertuo", ["vertuo-melozio"]],
  ["vertuo-oat-and-granola-latte-lactose-free", "vertuo", ["vertuo-melozio"]], ["vertuo-very-vanilla-latte", "vertuo", ["vertuo-sweet-vanilla"]], ["vertuo-iced-vanilla-pumpkin-latte", "vertuo", ["vertuo-sweet-vanilla"]], ["vertuo-vanilla-gingerbread-martini", "vertuo", ["vertuo-sweet-vanilla"]],
  ["vertuo-caramel-toffee-latte", "vertuo", ["vertuo-golden-caramel"]], ["vertuo-iced-salted-caramel-latte", "vertuo", ["vertuo-golden-caramel"]], ["vertuo-frozen-caramel-latte", "vertuo", ["vertuo-golden-caramel"]], ["vertuo-hazelnut-drinking-chocolate", "vertuo", ["vertuo-roasted-hazelnut"]],
  ["vertuo-sweet-hazelnut-coffee-float", "vertuo", ["vertuo-roasted-hazelnut"]], ["vertuo-warm-brown-sugar-latte-macchiato", "vertuo", ["vertuo-ristretto-classico"]], ["vertuo-dark-chocolate-pistachio-latte", "vertuo", ["vertuo-ristretto-classico"]], ["vertuo-campfire-latte", "vertuo", ["vertuo-ristretto-classico"]],
  ["vertuo-espresso-martini", "vertuo", ["vertuo-ristretto-classico"]], ["vertuo-almond-intenso-mocha", "vertuo", ["vertuo-intenso"]], ["vertuo-intenso-affogato-float", "vertuo", ["vertuo-intenso"]], ["vertuo-chilled-lungo-chai", "vertuo", ["vertuo-intenso"]],
  ["vertuo-shaken-vietnamese-coffee", "vertuo", ["vertuo-ice-forte"]], ["vertuo-watermelon-intenso-spritzer", "vertuo", ["vertuo-ice-forte"]], ["vertuo-intenso-breakfast-smoothie", "vertuo", ["vertuo-ice-forte"]], ["vertuo-vanilla-matcha-cappuccino", "vertuo", ["vertuo-colombia"]],
  ["vertuo-boozy-berry", "vertuo", ["vertuo-colombia"]], ["vertuo-iced-ginger-fizz", "vertuo", ["vertuo-kahawa-ya-congo"]], ["vertuo-congo-sunset-spritz", "vertuo", ["vertuo-kahawa-ya-congo"]],
  ["vertuo-peppermint-pinwheel-viennois", "vertuo", ["vertuo-peppermint-pinwheel"]], ["vertuo-gingerbread-viennois", "vertuo", ["vertuo-gingerbread"]],
  ["vertuo-almond-reverso", "vertuo", ["vertuo-bianco-forte"]], ["vertuo-mango-sesame-viennois", "vertuo", ["vertuo-el-salvador"]],
  ["vertuo-roasted-hazelnut-honey-oat-reverso", "vertuo", ["vertuo-roasted-hazelnut"]], ["vertuo-rich-chocolate-pear-almond-viennois", "vertuo", ["vertuo-rich-chocolate"]],
  ["vertuo-golden-delight", "vertuo", ["vertuo-melozio"]],
  ["vertuo-coconut-chocolate-iced-latte", "vertuo", ["vertuo-fortado"]], ["vertuo-spicy-oat-latte", "vertuo", ["vertuo-oatly-barista-edition"]],
  ["vertuo-reverso-intenso", "vertuo", ["vertuo-bianco-forte"]], ["vertuo-symphony-golden-dragon", "vertuo", ["vertuo-melozio"]],
  ["vertuo-sweet-active-delight", "vertuo", ["vertuo-active-vitamin-b6"]], ["vertuo-almond-coffee", "vertuo", ["vertuo-odacio"]],
  ["vertuo-gourmandise-coffee", "vertuo", ["vertuo-melozio"]],
];

export const recipeIds = recipeReferences.map(([id]) => id);

const recipeIdsByCapsule = new Map<string, readonly string[]>();

for (const [recipeId, system, capsuleIds, allOriginal] of recipeReferences) {
  const matchingCapsuleIds = allOriginal ? ["*"] : capsuleIds;
  for (const capsuleId of matchingCapsuleIds) {
    const key = `${system}:${capsuleId}`;
    recipeIdsByCapsule.set(key, [...(recipeIdsByCapsule.get(key) ?? []), recipeId]);
  }
}

export function getRecipeIdsForCapsule(capsuleId: string, system: CoffeeSystem): readonly string[] {
  const specificIds = recipeIdsByCapsule.get(`${system}:${capsuleId}`) ?? [];
  if (system !== "original") return specificIds;
  return [...(recipeIdsByCapsule.get("original:*") ?? []), ...specificIds];
}
