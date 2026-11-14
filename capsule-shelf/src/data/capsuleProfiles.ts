import type { Capsule, CapsuleCoffeeProfile } from "../domain/capsules";

type ProfileRow = [
  id: string,
  aromaticProfile: string,
  coffeeGrams: number | null,
  intensity: number | null,
  bitterness: number | null,
  acidity: number | null,
  body: number | null,
  roasting: number | null,
  caffeineMg: number | null,
  includesRobusta: boolean,
];

const originalRows: ProfileRow[] = [
  ["arpeggio", "Intensely roasted / cocoa", 5.3, 9, 4, 2, 4, 4, 63, false],
  ["ristretto", "Intensely roasted / fruity", 5.7, 10, 3, 4, 4, 4, 75, true],
  ["napoli", "Woody / spicy", 5.7, 13, 5, 1, 5, 5, 109, true],
  ["kazaar", "Woody / spicy", 6, 12, 5, 1, 5, 5, 113, true],
  ["roma", "Woody / cereals", 4.8, 8, 4, 4, 3, 3, 63, true],
  ["venezia", "Mellow", 5.6, 8, 3, 1, 4, 4, 77, true],
  ["livanto", "Caramel", 5.3, 7, 3, 3, 3, 3, 64, false],
  ["capriccio", "Cereals", 4.3, 5, 3, 3, 2, 2, 64, true],
  ["volluto", "Cereals / fruity", 4.5, 4, 2, 3, 2, 2, 60, false],
  ["cosi", "Cereals / fruity", 4.8, 4, 2, 3, 2, 2, 60, false],
  ["colombia", "Fruity-winey", 5.7, 6, 3, 4, 3, 3, 64, false],
  ["crystal-spark", "Toasted cereal", 5.3, 8, 3, 2, 4, 2, 85, false],
  ["hazelnut-brownie", "Brownie flavor", 4.5, null, 2, 3, 2, 2, 56, false],
  ["blueberry-cheesecake", "Blueberry cheesecake", 4.5, null, 2, 3, 2, 2, 56, false],
  ["pumpkin-spice-cake", "Pumpkin pie, clove", 4.5, null, 2, 3, 2, 2, 56, false],
  ["yuzu-vanilla-over-ice", "Yuzu & vanilla", 4.9, null, 2, 2, 2, 2, 62, false],
  ["maple-pecan", "Maple & pecan", 4.5, null, 2, 3, 2, 2, 56, false],
  ["volluto-decaffeinato", "Cereal / fruity", 4.9, 4, 2, 3, 2, 2, 1.7, false],
  ["vaniglia-decaffeinato", "Custardy & vanilla", 5, null, 1, 2, 2, 2, 2, false],
  ["arpeggio-decaffeinato", "Intensely roasted / cocoa", 5.5, 9, 4, 2, 4, 4, 2, false],
  ["ristretto-decaffeinato", "Intensely roasted / hint of fruity", 5.7, 10, 4, 3, 4, 4, 2, true],
  ["vienna-lungo-decaffeinato", "Malty cereal, sweet", 5.6, 7, 2, 2, 2, 3, null, false],
  ["athens-freddo-intenso", "Cereal, woody", 4.8, null, 2, 2, 2, 2, 56, false],
  ["cape-town-lungo", "Roastiness, woody", 5.5, 10, 4, 1, 4, 5, 110, true],
  ["miami-espresso", "Pepper / tobacco", 5.6, 9, 4, 1, 4, 5, 85, true],
  ["vienna-lungo", "Malty cereal, sweet", 5.5, 6, 2, 1, 2, 3, 75, false],
  ["paris-espresso", "Cereal / biscuit", 5.6, 6, 3, 2, 3, 3, 75, true],
  ["tokyo-lungo", "Floral, hint of fruit", 5.8, 6, 2, 1, 3, 3, 82, false],
  ["stockholm-lungo", "Sweet cereal / malted", 6, 8, 3, 2, 3, 4, 80, false],
  ["shanghai-lungo", "Orange / peach / fruit", 5.6, 5, 1, 2, 2, 2, 82, true],
  ["buenos-aires-lungo", "Sweet / caramel / popcorn", 5.6, 4, 1, 2, 1, 1, 104, true],
  ["kahawa-ya-congo", "Biscuit, cereal, fruity", 5.5, 7, 3, 3, 3, 3, null, false],
  ["india", "Spicy", 5.5, 11, 5, 1, 3, 5, 105, true],
  ["indonesia-fairtrade", "Woody", 5.7, 8, 2, 4, 3, 3, 72, false],
  ["nicaragua", "Sweet honey", 5, 5, 2, 3, 3, 2, 65, false],
  ["nocciola", "Rich & nutty", 4.5, null, 2, 3, 2, 2, 56, false],
  ["caramello", "Creamy & caramel", 4.5, null, 2, 3, 2, 2, 56, false],
  ["vaniglia", "Velvety & vanilla", 5, null, 2, 3, 2, 2, 56, false],
  ["cioccolatino", "Creamy & chocolately", 4.5, null, 2, 3, 2, 2, 56, false],
  ["scuro", "Intense", 5.5, null, 3, null, 4, 2, 73, false],
];

const vertuoRows: ProfileRow[] = [
  ["active-vitamin-b6", "Almond, vanilla & B6", 10, null, 2, 3, 3, 3, 120, false],
  ["altissio", "Full-bodied and creamy", 7, 9, 3, 2, 4, 4, 108, false],
  ["altissio-decaffeinato", "Cereal, roasted", 7, 9, 3, 2, 4, 4, 4, false],
  ["alto-ambrato", "Honeyed & delicate", 17.1, 4, 2, 1, 2, 2, 170, true],
  ["alto-onice", "Roasted & woody", 17.1, 7, 3, 1, 3, 3, 190, true],
  ["arondio", "Cereal and mild", 10, 6, 3, 3, 4, 3, 150, true],
  ["bianco-doppio", "Cereal, caramel & biscuit", 10.2, null, 1, 1, 2, 1, 105, false],
  ["bianco-forte", "Dark roasted", 12.5, null, 4, 1, 2, 5, 160, false],
  ["blueberry-cheesecake", "Blueberry cheesecake", 10.8, null, 2, 2, 2, 2, 140, false],
  ["blue-bottle-bold-blend", "Sweet caramel, nuts, malted", 12.5, 5, 1, 2, 1, 1, null, false],
  ["cinnamon-apple-crisp", "Cinnamon and apple", 10.8, null, 2, 2, 2, 2, 140, false],
  ["cold-brew-style-intense", "Roasted & caramel", 17.1, 7, 2, 1, null, 2, 114, true],
  ["colombia", "Fruity and winey", 12.5, 5, 1, 4, 2, 2, 165, false],
  ["costa-rica", "Cereal and mild", 10.5, 7, 4, 2, 4, 4, 140, false],
  ["crystal-spark", "Biscuit, cocoa", 10.2, 6, 3, 3, 4, 3, 125, false],
  ["diavolitto", "Highly intense and powerful", 7, 11, 4, 1, 4, 4, 144, true],
  ["double-espresso-chiaro", "Dense and wild", 10, 8, 3, 2, 4, 3, 135, false],
  ["double-espresso-chiaro-decaffeinato", "Dense and wild", 10, 8, 3, 2, 4, 3, 3, false],
  ["double-espresso-dolce", "Cereal & malt", 9.5, 5, 2, 2, 3, 3, 133, true],
  ["double-espresso-scuro", "Dark and bold", 10, 11, 4, 1, 4, 4, 150, true],
  ["el-salvador", "Sweet & jam", 12.5, 5, 1, 4, 2, 2, 140, false],
  ["ethiopia", "Flowery, berry", 9.5, 4, 2, 4, 3, 2, 119, false],
  ["fortado", "Intense and full-bodied", 10, 8, 5, 2, 5, 5, 195, true],
  ["fortado-decaffeinato", "Roasted, woody", 10, 8, 5, 2, 5, 5, 7, true],
  ["gingerbread", "Gingerbread", 10.8, null, 2, 2, 2, 2, 140, false],
  ["ginseng-delight", "Soft caramel & delicate ginseng", 9.5, null, 2, 3, 3, 3, 85, true],
  ["golden-caramel", "Creamy & biscuity", 10.8, null, 1, 1, 2, 2, 140, false],
  ["half-caffeinato", "Sweet and velvety", 12.5, 5, 2, 3, 2, 2, 83, false],
  ["hazelnut-brownie", "Hazelnut brownie", 10.8, null, 2, 2, 2, 2, 140, false],
  ["ice-forte", "Cereal, woody, peppery", 12.5, null, null, null, null, null, 161, false],
  ["ice-leggero", "Toasted cereal, fruity", 10, null, null, null, null, null, 120, false],
  ["il-caffe", "Cereal, spicy", 6.3, 11, 4, 1, 5, 5, 140, true],
  ["inizio", "Floral & cereal", 10, 4, 2, 4, 3, 2, 120, false],
  ["intenso", "Deep and dense", 12.5, 9, 4, 2, 4, 4, 195, true],
  ["kahawa-ya-congo", "Cereal, nutty, fruity", 12.5, 6, 2, 2, 3, 2, 150, false],
  ["maple-pecan", "Maple & pecan", 12.5, null, null, null, null, null, null, false],
  ["melozio", "Biscuity, cereal", 12.5, 6, 2, 3, 3, 3, 170, false],
  ["melozio-decaffeinato", "Cereal, honey", 12.5, 6, 2, 3, 3, 3, 11, false],
  ["mexico", "Intense and spiced", 12.5, 7, 3, 2, 3, 3, 190, true],
  ["nola-style-coffee-blend", "Chicory", 9.5, null, 2, 2, 2, 2, 135, true],
  ["oatly-barista-edition", "Sweet & cereal notes", 10, null, null, null, null, null, null, false],
  ["odacio", "Bold and lively", 12.5, 7, 2, 3, 3, 4, 170, false],
  ["orafio", "Cereal, liquorice, spicy", 6.2, 6, 3, 3, 3, 3, 110, true],
  ["peppermint-pinwheel", "Sweet candy, peppermint", 10.8, null, 2, 2, 2, 2, 140, false],
  ["carafe-pour-over-style", "Woody cedar", 17.1, null, 4, 1, 2, 3, 230, false],
  ["pumpkin-spice-cake", "Sweet pumpkin, cinnamon", 12.5, null, 2, 2, 2, 2, 140, false],
  ["rich-chocolate", "Creamy & chocolately", 10.8, null, 1, 1, 2, 2, 140, false],
  ["ristretto-classico", "Roasted & berry", 7, 9, 4, 3, 3, 4, null, false],
  ["roasted-hazelnut", "Rich & nutty", 12.5, null, 1, 1, 2, 2, null, false],
  ["samra-origins-togetherness-blend", "Woody & earthy", 10.2, 7, 2, 4, 3, 2, 120, false],
  ["solelio", "Fruity and lightly-bodied", 12.5, 2, 1, 3, 1, 1, 133, false],
  ["starbucks-holiday-blend", "Sweet maple & herbal notes", 12.4, null, null, null, null, null, null, false],
  ["starbucks-blonde-espresso-roast", "Smooth & sweet", 6.8, 6, null, null, null, null, 75, false],
  ["starbucks-caffe-verona", "Cocoa & caramelized sugar", 12.5, 10, null, null, null, null, 165, false],
  ["starbucks-espresso-roast", "Molasses & caramel", 6.8, 11, null, null, null, null, 70, false],
  ["starbucks-french-roast", "Dark caramel & sweet smoke", 12.5, null, null, null, null, null, null, false],
  ["starbucks-pike-place-roast", "Cocoa & praline", 12.5, 7, null, null, null, null, 170, false],
  ["starbucks-single-origin-colombia", "Walnut & herbs", 12.5, 7, null, null, null, null, 170, false],
  ["starbucks-smooth-caramel", "Buttery caramel & vanilla", 12.5, 5, null, null, null, null, null, false],
  ["starbucks-creamy-vanilla", "Vanilla & shortbread", 12.5, 5, null, null, null, null, null, false],
  ["starbucks-veranda-blend", "Roasted chocolatey", 12.5, 6, null, null, null, null, 165, false],
  ["stormio", "Rich and strong", 12.5, 8, 4, 1, 4, 4, 165, true],
  ["sweet-vanilla", "Creamy & sweet", 12.5, null, 1, 1, 2, 2, null, false],
  ["sweet-vanilla-decaffeinato", "Creamy & sweet", 12.5, null, 2, 2, 2, 2, 3, false],
  ["voltesso", "Light and sweet", 5.2, 4, 2, 4, 3, 2, 64, false],
  ["vivida", "Sweet and cereal", 12.5, 6, 2, 1, 3, 3, 170, false],
];

function profileFromRow(row: ProfileRow): CapsuleCoffeeProfile {
  const [, aromaticProfile, coffeeGrams, , bitterness, acidity, body, roasting, caffeineMg, includesRobusta] = row;
  return {
    aromaticProfile,
    ...(coffeeGrams === null ? {} : { coffeeGrams }),
    ...(bitterness === null ? {} : { bitterness }),
    ...(acidity === null ? {} : { acidity }),
    ...(body === null ? {} : { body }),
    ...(roasting === null ? {} : { roasting }),
    ...(caffeineMg === null ? {} : { caffeineMg }),
    includesRobusta,
  };
}

const originalProfiles = Object.fromEntries(originalRows.map((row) => [row[0], { profile: profileFromRow(row), intensity: row[3] ?? undefined }]));
const vertuoProfiles = Object.fromEntries(vertuoRows.map((row) => [row[0], { profile: profileFromRow(row), intensity: row[3] ?? undefined }]));

const aromaticTerms = [
  ["floral", "flower", "flowery", "fleur", "fleurs", "florale", "цветочный", "цветочные", "цветочными"],
  ["cereal", "cereals", "grain", "grains", "céréale", "céréales", "злак", "злаки", "злаковый", "зерновой"],
  ["fruity", "fruit", "fruits", "fruité", "fruitée", "fruités", "фруктовый", "фруктовые", "фруктовыми"],
  ["berry", "berries", "berries", "baies", "berry", "ягода", "ягодный", "ягодные"],
  ["roasted", "roast", "roasting", "roasty", "torréfié", "torréfaction", "обжарка", "обжаренный", "жареный"],
  ["woody", "wood", "boisé", "boisée", "bois", "древесный", "древесные", "древесными"],
  ["spicy", "spice", "spices", "épicé", "épicée", "épices", "пряный", "пряные", "специи"],
  ["cocoa", "chocolate", "chocolaty", "cacao", "chocolat", "какао", "шоколад", "шоколадный"],
  ["caramel", "caramelized", "caramélisé", "карамель", "карамельный"],
  ["vanilla", "vanille", "ваниль", "ванильный"],
  ["nutty", "nuts", "nut", "noix", "noisette", "орех", "ореховый", "фундук"],
  ["sweet", "sugar", "sucré", "sucrée", "sucrés", "сладкий", "сладкие", "сладость"],
  ["honey", "honeyed", "miel", "mielleux", "мёд", "медовый"],
  ["citrus", "citrusy", "citron", "agrumes", "цитрус", "цитрусовый"],
  ["almond", "amande", "миндаль", "миндальный"],
  ["biscuit", "biscuity", "cookie", "biscuité", "biscuitée", "бисквит", "печенье"],
  ["smoky", "smoke", "fumé", "fumée", "дымный", "дым"],
];

function normalizeTerm(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();
}

export function matchesAromaticProfile(profile: string | undefined, query: string): boolean {
  if (!profile || !query.trim()) return false;
  const normalizedProfile = normalizeTerm(profile);
  const normalizedQuery = normalizeTerm(query).trim();
  if (normalizedProfile.includes(normalizedQuery)) return true;
  return normalizedQuery.split(/\s+/).every((word) => {
    if (normalizedProfile.includes(word)) return true;
    const matchingTerms = aromaticTerms.find((terms) => terms.some((term) => normalizeTerm(term) === word));
    return matchingTerms?.some((term) => normalizedProfile.includes(normalizeTerm(term))) ?? false;
  });
}

export function applyCapsuleCoffeeProfile(capsule: Capsule): Capsule {
  const isVertuo = capsule.system === "vertuo";
  const profiles = isVertuo ? vertuoProfiles : originalProfiles;
  const id = isVertuo ? capsule.id.replace(/^vertuo-/, "") : capsule.id;
  const details = profiles[id];
  return details ? { ...capsule, intensity: details.intensity ?? capsule.intensity, coffeeProfile: details.profile } : capsule;
}
