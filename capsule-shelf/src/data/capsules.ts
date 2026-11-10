import type { Capsule } from "../domain/capsules";

const canadaCatalog = "https://www.nespresso.com/ca/en/order/capsules/original";
const image = (_media: string, file: string) => `${import.meta.env.BASE_URL}images/capsules/${encodeURIComponent(file)}`;
const capsule = (id: string, name: string, flavor: string, category: Capsule["category"], slug: string, imageUrl: string, intensity?: number): Capsule => ({
  id, name, flavor, category, sourceUrl: `${canadaCatalog}/${slug}`, imageUrl, ...(intensity === undefined ? {} : { intensity }), imageFit: "contain",
});

export const capsules: Capsule[] = [
  capsule("arpeggio", "Arpeggio", "Интенсивный, с нотами какао", "italian", "ispirazione-firenze-coffee-capsule", image("16653366034462", "arpeggio-2x.png"), 9),
  capsule("ristretto", "Ristretto", "Ярко обжаренный, с ягодными нотами", "italian", "ispirazione-ristretto-italiano-coffee-capsule", image("51908682154014", "ispirazione-ristretto-italiano-XL-1-1-.png"), 10),
  capsule("napoli", "Ispirazione Napoli", "Тёмная обжарка с насыщенными нотами какао", "italian", "ispirazione-napoli-coffee-capsule", image("16653931806750", "ispirazione-napoli-2x.png"), 13),
  capsule("kazaar", "Kazaar", "Пряный и древесный", "italian", "ispirazione-palermo-coffee-capsule", image("16653942259742", "kazaar-2x.png"), 12),
  capsule("roma", "Ispirazione Roma", "Древесные и сухие злаковые ноты", "italian", "ispirazione-roma-coffee-capsule", image("16653932462110", "ispirazione-roma-2x.png"), 8),
  capsule("venezia", "Ispirazione Venezia", "Поджаренные злаки и карамель", "italian", "ispirazione-venezia-coffee-capsule", image("16653932789790", "ispirazione-venezia-2x.png"), 8),
  capsule("livanto", "Livanto", "Карамель и поджаренные злаки", "italian", "ispirazione-livanto-coffee-capsule", image("16653944487966", "livanto-2x.png"), 7),
  capsule("capriccio", "Capriccio", "Сухие злаковые ноты", "heritage", "original-capriccio-coffee-capsule", image("16653514899486", "capriccio-2x.png"), 5),
  capsule("volluto", "Volluto", "Сладкий и лёгкий", "heritage", "original-volluto-coffee-capsule", image("16724852604958", "volluto-2x.png"), 4),
  capsule("cosi", "Cosi", "Мягкий и деликатно обжаренный", "heritage", "cosi", image("15762785566750", "cosi.png"), 4),
  capsule("colombia", "Colombia", "Яркий фруктовый профиль", "origins", "colombia-original-coffee-capsule", image("16653527384094", "colombia-2x.png"), 6),

  capsule("crystal-spark", "Espresso Crystal Spark", "Яркий эспрессо с выразительным характером", "limited", "crystal-spark-espresso-coffee-capsules", image("51218124242974", "C-1409-PLP-320x320.png"), 8),
  capsule("hazelnut-brownie", "Hazelnut Brownie", "Ореховые ноты и аромат брауни", "limited", "hazelnut-brownie-lungo-coffee-capsules", image("51207982186526", "C-1405-PLP-320x320.png")),
  capsule("blueberry-cheesecake", "Blueberry Cheesecake", "Ягодный десертный аромат", "limited", "blueberry-cheesecake-lungo-coffee-capsules", image("51211137679390", "C-1407-PLP-320x320.png")),
  capsule("pumpkin-spice-cake", "Pumpkin Spice Cake", "Тёплые пряности и тыквенный пирог", "limited", "pumpkin-spice-original-coffee-capsules", image("32074134781982", "Pumpkin-Spice-Cake-2x.png")),
  capsule("yuzu-vanilla-over-ice", "Yuzu Vanilla Over Ice", "Цитрусовый юдзу и ваниль", "limited", "yuzu-vanilla-over-ice-coffee-capsule", image("47955984711710", "C-1388-PLP-320x320.png")),
  capsule("maple-pecan", "Maple Pecan", "Кленовая сладость и орех пекан", "limited", "original-maple-pecan-coffee-capsules", image("46386324996126", "C-1333-ResposivePLP.png")),

  capsule("arpeggio-decaffeinato", "Arpeggio Decaffeinato", "Интенсивный какао-профиль без кофеина", "decaffeinated", "ispirazione-arpeggio-decaffeinato-coffee-capsule", image("34682651541534", "arpeggio-decaffeinato-plp.png"), 9),
  capsule("ristretto-decaffeinato", "Ristretto Decaffeinato", "Яркая обжарка без кофеина", "decaffeinated", "ristretto-italiano-decaffeinato-coffee-capsule", image("34682663632926", "ristretto-decaffeinato-plp.png"), 10),
  capsule("vaniglia-decaffeinato", "Vaniglia Decaffeinato", "Ванильный аромат и кофе без кофеина", "decaffeinated", "vaniglia-decaf-coffee-capsules", image("44327065813022", "C-1324-OL-PLP-320x320.png")),
  capsule("volluto-decaffeinato", "Volluto Decaffeinato", "Мягкий, сладкий кофе без кофеина", "decaffeinated", "originalline-volluto-decaffeinato-coffee-capsule", image("34682639351838", "volluto-decaffeinato-plp.png"), 4),
  capsule("vienna-lungo-decaffeinato", "Vienna Lungo Decaffeinato", "Злаковый лунго без кофеина", "decaffeinated", "vienna-original-decaf-coffee-capsule", image("33381856575518", "vienna-lungo-decaf-2x.png"), 7),

  capsule("athens-freddo-intenso", "Athens Freddo Intenso", "Интенсивный кофе для холодных напитков", "world", "athens-freddo-intenso-coffee-capsules", image("15431146242078", "before-PLP-318x318px.png")),
  capsule("cape-town-lungo", "Cape Town Lungo", "Насыщенный, с древесными нотами", "world", "cape-town-envivo-lungo-coffee-capsule", image("16653513130014", "cape-town-lungo-2x.png"), 10),
  capsule("miami-espresso", "Miami Espresso", "Округлый эспрессо с зерновыми нотами", "world", "miami-espresso-coffee-capsules", image("16653945307166", "miami-2x.png"), 9),
  capsule("vienna-lungo", "Vienna Lungo", "Мягкий лунго с солодовыми нотами", "world", "vienna-linizio-lungo-coffee-capsule", image("16724849066014", "vienna-lungo-2x.png"), 6),
  capsule("paris-espresso", "Paris Espresso", "Насыщенный кофе с зерновым профилем", "world", "paris-espresso-coffee-capsules", image("16724971225118", "paris-2x.png"), 6),
  capsule("tokyo-lungo", "Tokyo Lungo", "Цветочные и фруктовые ноты", "world", "tokyo-vivalto-lungo-coffee-capsule", image("16724845232158", "tokyo-lungo-2x.png"), 6),
  capsule("stockholm-lungo", "Stockholm Lungo", "Интенсивный лунго с горьковатой нотой", "world", "stockholm-fortissio-lungo-coffee-capsule", image("16724841758750", "stockholm-lungo-2x.png"), 8),
  capsule("shanghai-lungo", "Shanghai Lungo", "Деликатный лунго с фруктовыми нотами", "world", "shanghai-lungo-coffee-capsule", image("52362566795294", "shangai-lungo-2x.png"), 5),
  capsule("buenos-aires-lungo", "Buenos Aires Lungo", "Сладкий и сбалансированный лунго", "world", "buenos-aires-lungo-coffee-capsule", image("52476193636382", "buenos-aires-lungo-2x.png"), 4),

  capsule("caffe-florian", "Caffè Florian", "Древесные и пряные ноты", "limited", "caffe-florian", "https://www.nespresso.com/ecom/medias/sys_master/public/35022539685918/C-1299-OL-ResponsiveStandard.png", 9),
  capsule("espresso-of-wonders", "Espresso of Wonders", "Злаки, спелые фрукты и карамель с древесным оттенком", "limited", "espresso-wonders-original-coffee-capsules", "https://www.nespresso.com/jo/en/media/catalog/product/o/l/ol-festive-black.png", 7),

  capsule("kahawa-ya-congo", "Kahawa ya Congo", "Фруктовый профиль с яркой кислинкой", "origins", "kahawa-congo-original-pods", image("16653939277854", "kahawa-ya-congo-2x.png"), 7),
  capsule("india", "India", "Пряный кофе с древесными нотами", "origins", "india-original-coffee-capsule", image("16653744439326", "india-2x.png"), 11),
  capsule("indonesia-fairtrade", "Indonesia - Fairtrade", "Злаковые и древесные оттенки", "origins", "indonesia-original-coffee-capsule", image("16653745881118", "indonesia-2x.png"), 8),
  capsule("nicaragua", "Nicaragua", "Сладкий кофе с фруктовыми нотами", "origins", "nicaragua-original-coffee-capsule", image("16654090272798", "nicaragua-2x.png"), 5),

  capsule("nocciola", "Nocciola", "Аромат жареного фундука", "flavoured", "nocciola-coffee-capsules", image("17432559943710", "C-1063-Responsive-PLP.png")),
  capsule("caramello", "Caramello", "Аромат сливочной карамели", "flavoured", "caramello-coffee-capsules", image("17431332945950", "C-1061-Responsive-PLP.png")),
  capsule("vaniglia", "Vaniglia", "Аромат ванили", "flavoured", "vaniglia-coffee-capsules", image("17432222531614", "C-1062-Responsive-PLP.png")),
  capsule("cioccolatino", "Cioccolatino", "Аромат тёмного шоколада", "flavoured", "cioccolatino-coffee-capsules", image("17431322361886", "C-1060-Responsive-PLP.png")),
  capsule("scuro", "Scuro", "Интенсивный профиль для молочных рецептов", "flavoured", "scuro-coffee-capsule", image("16654104068126", "scuro-2x.png"), 8),
];
