import { calendarData as holidayData } from "./calendar-data.js";

const photos = {
  canada: {
    url: "https://images.unsplash.com/photo-1721140851388-811cc2d5dd7d?auto=format&fit=crop&w=1500&q=82",
    credit: "Venkatesan P",
    page: "https://unsplash.com/photos/a-large-fireworks-display-in-the-night-sky-gnZqqTDOjOk",
    alt: { en: "Fireworks over Ottawa on Canada Day", fr: "Feux d’artifice au-dessus d’Ottawa pour la fête du Canada", ru: "Фейерверк над Оттавой в День Канады" },
  },
  remembrance: {
    url: "https://images.unsplash.com/photo-1762954716289-eb03e2a2d060?auto=format&fit=crop&w=1500&q=82",
    credit: "Alan Ko",
    page: "https://unsplash.com/photos/person-lays-poppies-at-a-war-memorial-W0lracWG0F4",
    alt: { en: "Poppies laid at an Ottawa war memorial", fr: "Coquelicots déposés au monument commémoratif d’Ottawa", ru: "Маки у военного мемориала в Оттаве" },
  },
  autumn: {
    url: "https://images.unsplash.com/photo-1454129170132-347ea87dc9dd?auto=format&fit=crop&w=1500&q=82",
    credit: "Anthony Lee",
    page: "https://unsplash.com/photos/closeup-photo-of-maple-leaves-zZ-G8iQOwa8",
    alt: { en: "Sunlit maple leaves in autumn", fr: "Feuilles d’érable d’automne baignées de soleil", ru: "Кленовые листья в осеннем солнце" },
  },
  newYear: {
    url: "https://images.unsplash.com/photo-1620387581117-f15d344426df?auto=format&fit=crop&w=1500&q=82",
    credit: "ILLIYEEN",
    page: "https://unsplash.com/photos/red-and-white-fireworks-display-during-nighttime-I9NhVjTa3qE",
    alt: { en: "Red and white fireworks on New Year’s night", fr: "Feux d’artifice rouges et blancs pour le Nouvel An", ru: "Красно-белый фейерверк в новогоднюю ночь" },
  },
  winter: {
    url: "https://images.unsplash.com/photo-1775533222841-095c4e19ceaf?auto=format&fit=crop&w=1500&q=82",
    credit: "Lianhao Qu",
    page: "https://unsplash.com/photos/snowy-street-with-christmas-lights-and-buildings-at-night-ZrN4Y_ts2XU",
    alt: { en: "Snowy Québec City street lit for the holidays", fr: "Rue enneigée de Québec illuminée pour les fêtes", ru: "Заснеженная улица Квебека с праздничными огнями" },
  },
  family: {
    url: "https://images.unsplash.com/photo-1759193513589-9bfc3ce1dc63?auto=format&fit=crop&w=1500&q=82",
    credit: "Emily Wassmansdorf",
    page: "https://unsplash.com/photos/people-sledding-together-on-a-snowy-day-Rx8qEPcaEYA",
    alt: { en: "People sledding together in Kitchener, Ontario", fr: "Des personnes font de la luge à Kitchener, en Ontario", ru: "Люди катаются на санках в Китченере, Онтарио" },
  },
  spring: {
    url: "https://images.unsplash.com/photo-1684371942180-ff82a7240091?auto=format&fit=crop&w=1500&q=82",
    credit: "Venkatesan P",
    page: "https://unsplash.com/photos/a-close-up-of-a-single-red-flower-I96zVSeEv-s",
    alt: { en: "A red tulip in Ottawa’s Commissioners Park", fr: "Une tulipe rouge au parc des Commissaires à Ottawa", ru: "Красный тюльпан в парке Комиссаров в Оттаве" },
  },
  summer: {
    url: "https://images.unsplash.com/photo-1595598239736-223ad4fe7da5?auto=format&fit=crop&w=1500&q=82",
    credit: "Joshua Woroniecki",
    page: "https://unsplash.com/photos/green-grass-field-and-green-trees-under-blue-sky-during-daytime-BEZjwN7uTds",
    alt: { en: "A green summer field in Jasper, Alberta", fr: "Un champ verdoyant en été à Jasper, en Alberta", ru: "Зелёное летнее поле в Джаспере, Альберта" },
  },
  reconciliation: {
    url: "https://images.unsplash.com/photo-1632799442159-42bb99708e37?auto=format&fit=crop&w=1500&q=82",
    credit: "Aedrian Salazar",
    page: "https://unsplash.com/photos/an-orange-t-shirt-hanging-on-a-tree-branch-a6tSFH7WEXQ",
    alt: { en: "An orange shirt hanging from a tree for Every Child Matters", fr: "Un chandail orange suspendu à un arbre pour Chaque enfant compte", ru: "Оранжевая рубашка на ветке — символ Every Child Matters" },
  },
  picnic: {
    url: "https://images.unsplash.com/photo-1776653095455-9a4ab6acc838?auto=format&fit=crop&w=1500&q=82",
    credit: "Cuong Duyen Ceramics",
    page: "https://unsplash.com/photos/family-enjoying-a-picnic-in-a-park-e_YGRm4zc3w",
    alt: { en: "A family sharing a picnic outdoors", fr: "Une famille partage un pique-nique en plein air", ru: "Семья устраивает пикник на свежем воздухе" },
  },
};

const names = {
  "New Year’s Day": { en: "New Year’s Day", fr: "Jour de l’An", ru: "Новый год" },
  "Family Day": { en: "Family Day", fr: "Fête de la famille", ru: "День семьи" },
  "Louis Riel Day": { en: "Louis Riel Day", fr: "Jour de Louis Riel", ru: "День Луи Риэля" },
  "B.C. Day": { en: "B.C. Day", fr: "Jour de la Colombie-Britannique", ru: "День Британской Колумбии" },
  "Saskatchewan Day": { en: "Saskatchewan Day", fr: "Jour de la Saskatchewan", ru: "День Саскачевана" },
  "Nova Scotia Heritage Day": { en: "Nova Scotia Heritage Day", fr: "Jour du patrimoine de la Nouvelle-Écosse", ru: "День наследия Новой Шотландии" },
  "Islander Day": { en: "Islander Day", fr: "Jour des Insulaires", ru: "День островитян" },
  "Good Friday": { en: "Good Friday", fr: "Vendredi saint", ru: "Страстная пятница" },
  "Easter Monday": { en: "Easter Monday", fr: "Lundi de Pâques", ru: "Пасхальный понедельник" },
  "Easter Sunday": { en: "Easter Sunday", fr: "Dimanche de Pâques", ru: "Пасхальное воскресенье" },
  "Victoria Day": { en: "Victoria Day", fr: "Fête de Victoria", ru: "День Виктории" },
  "Canada Day": { en: "Canada Day", fr: "Fête du Canada", ru: "День Канады" },
  "Québec National Holiday": { en: "Québec National Holiday", fr: "Fête nationale du Québec", ru: "Национальный праздник Квебека" },
  "National Patriots’ Day": { en: "National Patriots’ Day", fr: "Journée nationale des patriotes", ru: "Национальный день патриотов" },
  "New Brunswick Day": { en: "New Brunswick Day", fr: "Fête du Nouveau-Brunswick", ru: "День Нью-Брансуика" },
  "National Indigenous Peoples Day": { en: "National Indigenous Peoples Day", fr: "Journée nationale des peuples autochtones", ru: "Национальный день коренных народов" },
  "Nunavut Day": { en: "Nunavut Day", fr: "Jour du Nunavut", ru: "День Нунавута" },
  "Civic Holiday": { en: "Civic Holiday", fr: "Congé civique", ru: "Гражданский праздник" },
  "Discovery Day": { en: "Discovery Day", fr: "Jour de la Découverte", ru: "День открытия" },
  "Labour Day": { en: "Labour Day", fr: "Fête du Travail", ru: "День труда" },
  "National Day for Truth and Reconciliation": { en: "National Day for Truth and Reconciliation", fr: "Journée nationale de la vérité et de la réconciliation", ru: "Национальный день истины и примирения" },
  Thanksgiving: { en: "Thanksgiving", fr: "Action de grâce", ru: "День благодарения" },
  "Remembrance Day": { en: "Remembrance Day", fr: "Jour du Souvenir", ru: "День памяти" },
  "Christmas Day": { en: "Christmas Day", fr: "Noël", ru: "Рождество" },
  "Boxing Day": { en: "Boxing Day", fr: "Lendemain de Noël", ru: "День подарков" },
  "Christmas Floater": { en: "Christmas floater", fr: "Congé mobile de Noël", ru: "Дополнительный выходной на Рождество" },
  "Day after New Year’s Day": { en: "Day after New Year’s Day", fr: "Lendemain du jour de l’An", ru: "День после Нового года" },
  "Floating Holiday": { en: "Floating holiday", fr: "Jour férié mobile", ru: "Плавающий выходной" },
  "Terry Fox Day": { en: "Terry Fox Day", fr: "Jour Terry Fox", ru: "День Терри Фокса" },
  "Natal Day": { en: "Natal Day", fr: "Jour de Natal", ru: "День Натал" },
  "Gold Cup Parade Day or civic holiday": { en: "Gold Cup Parade Day or civic holiday", fr: "Jour du défilé Gold Cup ou congé civique", ru: "День парада Gold Cup или городской выходной" },
  "St. Patrick’s Day": { en: "St. Patrick’s Day", fr: "Fête de la Saint-Patrick", ru: "День святого Патрика" },
  "St. George’s Day": { en: "St. George’s Day", fr: "Fête de la Saint-Georges", ru: "День святого Георгия" },
  "June Holiday": { en: "June Holiday", fr: "Congé de juin", ru: "Июньский выходной" },
  "Memorial Day": { en: "Memorial Day", fr: "Jour commémoratif", ru: "День памяти" },
  "Orangeman’s Day": { en: "Orangeman’s Day", fr: "Fête des orangistes", ru: "День оранжистов" },
  "Christmas Eve": { en: "Christmas Eve", fr: "Veille de Noël", ru: "Сочельник" },
  "New Year’s Eve": { en: "New Year’s Eve", fr: "Veille du jour de l’An", ru: "Канун Нового года" },
  "Local civic holiday": { en: "Local civic holiday", fr: "Jour civique local", ru: "Местный городской праздник" },
  "Provincial or civic holiday": { en: "Provincial or civic holiday", fr: "Jour férié provincial ou civique", ru: "Провинциальный или городской выходной" },
};

const calendarMeta = {
  regionalEmployment: { label: { en: "Regional employment standards", fr: "Normes d’emploi régionales", ru: "Региональные трудовые нормы" }, context: { en: "Minimum public-holiday dates under the selected region’s employment standards. Eligibility and substitute days can depend on your schedule and employer.", fr: "Dates minimales des jours fériés selon les normes d’emploi de la région choisie. L’admissibilité et les jours de remplacement peuvent dépendre de votre horaire et de votre employeur.", ru: "Минимальные даты выходных по трудовым нормам выбранного региона. Право на выходной и перенос могут зависеть от графика и работодателя." } },
  federalEmployment: { label: { en: "Federal employment standards", fr: "Normes d’emploi fédérales", ru: "Федеральные трудовые нормы" }, context: { en: "For federally regulated workplaces under the Canada Labour Code; this does not apply to every Canadian worker.", fr: "Pour les milieux de travail sous réglementation fédérale visés par le Code canadien du travail; ces règles ne s’appliquent pas à tous les travailleurs.", ru: "Для федерально регулируемых рабочих мест по Canada Labour Code; эти правила относятся не ко всем работникам Канады." } },
  regionalPublicService: { label: { en: "Regional public service", fr: "Fonction publique régionale", ru: "Региональная госслужба" }, context: { en: "The central government service schedule for this region. Collective agreements, departments, agencies and shift schedules can differ.", fr: "Calendrier central de la fonction publique de cette région. Les conventions collectives, ministères, organismes et horaires de travail peuvent différer.", ru: "Центральный календарь госслужбы этого региона. Коллективные договоры, ведомства, агентства и сменные графики могут отличаться." } },
  federalPublicService: { label: { en: "Federal public service", fr: "Fonction publique fédérale", ru: "Федеральная госслужба" }, context: { en: "Includes a region-level candidate for the designated provincial or civic holiday. Your exact date can depend on your work locality, schedule and agreement.", fr: "Inclut une date indicative à l’échelle régionale pour le jour férié provincial ou civique désigné. La date exacte peut dépendre du lieu de travail, de l’horaire et de la convention.", ru: "Добавлена ориентировочная дата провинциального или городского праздника для выбранного региона. Точная дата может зависеть от места работы, графика и договора." } },
};

const copy = {
  en: {
    tagline: "Find your next day off.", eyebrow: "A little more time for life", title: "Find your next day off.", intro: "A clear, calm guide to the holidays in your work calendar.", range: "2026—2027 calendar",
    languageLabel: "Language", calendarLabel: "Holiday calendar", settingsLabel: "Calendar settings", regionLabel: "Work region", regionSelectLabel: "Province or territory where you work",
    location: "Suggest my region", locationNote: "One-time suggestion · confirm where you work", locating: "Finding an approximate region…",
    locationDenied: "We couldn’t access your location. You can still choose your work region above.", locationNoMatch: "We couldn’t suggest a region from this location. Please choose where you work manually.",
    locationAmbiguous: "Your approximate location is near {regions}. Which one is your work region? Please confirm above.", locationDetected: "Your device appears to be in {region}. Is that where you work? Confirm above; your coordinates are not saved.",
    calendarEyebrow: "Choose your calendar", calendarHeading: "Different work, different holidays.",
    tabRegionalEmployment: "Regional employment", tabRegionalEmploymentMobile: "Region", tabRegionalEmploymentSub: "Employment standards", tabFederalEmployment: "Federal employment", tabFederalEmploymentMobile: "Federal", tabFederalEmploymentSub: "Canada Labour Code", tabRegionalPublicService: "Regional public service", tabRegionalPublicServiceMobile: "Region PS", tabRegionalPublicServiceSub: "Government employees", tabFederalPublicService: "Federal public service", tabFederalPublicServiceMobile: "Federal PS", tabFederalPublicServiceSub: "Government of Canada",
    upcomingEyebrow: "On the horizon", upcomingTitle: "Coming up next", showAll: "See all dates", showLess: "Show fewer dates",
    next: "Your next listed holiday", today: "Today is", days: "in {count} days", tomorrow: "tomorrow", yesterday: "yesterday", todayShort: "Today",
    noteTitle: "A helpful guide, not a promise from your employer.", noteBody: "These are dates listed in the selected calendar. Whether you have the day off, receive holiday pay, or observe another date can depend on eligibility, your schedule, employer policy and collective agreements.",
    footerCopy: "A small project to make planning a little easier.", sourceLink: "Official calendar source ↗", verified: "Dates checked against official sources · November 2026",
    photoBy: "Photo by", unsplash: "on Unsplash", imageFallback: "Holiday photo",
    localCivicNote: "This local/civic day can vary by location and employer. Confirm the date with your department or collective agreement.", observedNote: "This is the observed date published by the selected government calendar; your schedule or agreement may differ.", qcEasterChoice: "Québec employment standards allow the employer to choose Good Friday or Easter Monday; the other day is not automatically a paid holiday.", partialDayNote: "This is a half-day, not a full day off.",
    empty: "There are no upcoming dates in this calendar.", noOffice: "Office closures are not included in this calendar.",
  },
  fr: {
    tagline: "Trouvez votre prochain jour de congé.", eyebrow: "Un peu plus de temps pour vivre", title: "Quand est votre prochain congé?", intro: "Un guide simple et clair des jours fériés de votre calendrier de travail.", range: "Calendrier 2026—2027",
    languageLabel: "Langue", calendarLabel: "Calendrier des jours fériés", settingsLabel: "Paramètres du calendrier", regionLabel: "Région de travail", regionSelectLabel: "Province ou territoire de votre lieu de travail",
    location: "Suggérer ma région", locationNote: "Suggestion ponctuelle · confirmez votre lieu de travail", locating: "Recherche d’une région approximative…",
    locationDenied: "Nous n’avons pas pu accéder à votre position. Vous pouvez tout de même choisir votre région de travail ci-dessus.", locationNoMatch: "Impossible de suggérer une région. Choisissez manuellement votre lieu de travail.",
    locationAmbiguous: "Votre position approximative est près de {regions}. Laquelle correspond à votre lieu de travail? Confirmez ci-dessus.", locationDetected: "Votre appareil semble se trouver en {region}. Y travaillez-vous? Confirmez ci-dessus; vos coordonnées ne sont pas enregistrées.",
    calendarEyebrow: "Choisissez un calendrier", calendarHeading: "Les jours fériés varient selon le travail.",
    tabRegionalEmployment: "Normes d’emploi régionales", tabRegionalEmploymentMobile: "Région", tabRegionalEmploymentSub: "Normes d’emploi", tabFederalEmployment: "Normes fédérales", tabFederalEmploymentMobile: "Fédéral", tabFederalEmploymentSub: "Code canadien du travail", tabRegionalPublicService: "Fonction publique régionale", tabRegionalPublicServiceMobile: "Région FP", tabRegionalPublicServiceSub: "Employés gouvernementaux", tabFederalPublicService: "Fonction publique fédérale", tabFederalPublicServiceMobile: "Fédéral FP", tabFederalPublicServiceSub: "Gouvernement du Canada",
    upcomingEyebrow: "À l’horizon", upcomingTitle: "À venir", showAll: "Voir toutes les dates", showLess: "Voir moins de dates",
    next: "Prochain jour férié inscrit", today: "Aujourd’hui :", days: "dans {count} jours", tomorrow: "demain", yesterday: "hier", todayShort: "Aujourd’hui",
    noteTitle: "Un guide pratique, pas une promesse de votre employeur.", noteBody: "Ces dates figurent dans le calendrier sélectionné. Le congé, la rémunération ou une date de remplacement peuvent dépendre de l’admissibilité, de l’horaire, des politiques de l’employeur et de la convention collective.",
    footerCopy: "Un petit projet pour faciliter la planification.", sourceLink: "Source officielle du calendrier ↗", verified: "Dates vérifiées auprès de sources officielles · novembre 2026",
    photoBy: "Photo de", unsplash: "sur Unsplash", imageFallback: "Photo du jour férié", localCivicNote: "Ce jour civique local peut varier selon le lieu et l’employeur. Confirmez la date auprès de votre ministère ou de votre convention collective.", observedNote: "Il s’agit de la date observée publiée par le calendrier gouvernemental choisi; votre horaire ou convention peut différer.", qcEasterChoice: "Les normes d’emploi du Québec permettent à l’employeur de choisir entre le Vendredi saint et le lundi de Pâques; l’autre jour n’est pas automatiquement férié et payé.", partialDayNote: "Il s’agit d’une demi-journée, et non d’un congé complet.", empty: "Aucune date à venir dans ce calendrier.", noOffice: "Les fermetures de bureaux ne sont pas incluses dans ce calendrier.",
  },
  ru: {
    tagline: "Узнайте дату ближайшего выходного.", eyebrow: "Больше времени для жизни", title: "Когда ближайший выходной?", intro: "Простой и понятный календарь праздников по вашему рабочему профилю.", range: "Календарь на 2026—2027",
    languageLabel: "Язык", calendarLabel: "Календарь праздников", settingsLabel: "Настройки календаря", regionLabel: "Регион работы", regionSelectLabel: "Провинция или территория, где вы работаете",
    location: "Предложить регион", locationNote: "Одноразовая подсказка · подтвердите место работы", locating: "Определяем примерный регион…",
    locationDenied: "Нет доступа к геолокации. Вы всё равно можете выбрать регион работы выше.", locationNoMatch: "Не удалось предложить регион. Выберите место работы вручную.",
    locationAmbiguous: "По примерному местоположению вы рядом с регионами {regions}. Какой из них соответствует месту работы? Подтвердите выбор выше.", locationDetected: "Похоже, устройство находится в регионе {region}. Вы там работаете? Подтвердите регион выше; координаты не сохраняются.",
    calendarEyebrow: "Выберите календарь", calendarHeading: "Для разных видов работы — разные праздники.",
    tabRegionalEmployment: "Региональные трудовые нормы", tabRegionalEmploymentMobile: "Регион", tabRegionalEmploymentSub: "Минимум по закону", tabFederalEmployment: "Федеральные трудовые нормы", tabFederalEmploymentMobile: "Федеральный", tabFederalEmploymentSub: "Canada Labour Code", tabRegionalPublicService: "Региональная госслужба", tabRegionalPublicServiceMobile: "Регион. гос.", tabRegionalPublicServiceSub: "Сотрудники правительства", tabFederalPublicService: "Федеральная госслужба", tabFederalPublicServiceMobile: "Фед. гос.", tabFederalPublicServiceSub: "Правительство Канады",
    upcomingEyebrow: "Впереди", upcomingTitle: "Ближайшие даты", showAll: "Показать все даты", showLess: "Свернуть список",
    next: "Ближайший праздник по календарю", today: "Сегодня —", days: "через {count} дн.", tomorrow: "завтра", yesterday: "вчера", todayShort: "Сегодня",
    noteTitle: "Полезная подсказка, но не гарантия выходного от работодателя.", noteBody: "В календаре указаны официальные даты. Выходной, оплата или перенос могут зависеть от права на праздник, графика, политики работодателя и коллективного договора.",
    footerCopy: "Небольшой проект, чтобы упростить планирование.", sourceLink: "Официальный источник календаря ↗", verified: "Даты сверены с официальными источниками · ноябрь 2026",
    photoBy: "Фото", unsplash: "на Unsplash", imageFallback: "Фото праздника", localCivicNote: "Местный городской выходной может различаться по месту и работодателю. Уточните дату в ведомстве или коллективном договоре.", observedNote: "Это дата переноса из выбранного правительственного календаря; график или договор могут отличаться.", qcEasterChoice: "Трудовые нормы Квебека позволяют работодателю выбрать Страстную пятницу или Пасхальный понедельник; второй день не становится оплачиваемым выходным автоматически.", partialDayNote: "Это половина выходного дня, а не полный выходной.", empty: "В этом календаре нет предстоящих дат.", noOffice: "Закрытия отдельных учреждений не включены в этот календарь.",
  },
};

const provinceNames = {
  ON: { en: "Ontario", fr: "Ontario", ru: "Онтарио" }, BC: { en: "British Columbia", fr: "Colombie-Britannique", ru: "Британская Колумбия" },
  AB: { en: "Alberta", fr: "Alberta", ru: "Альберта" }, SK: { en: "Saskatchewan", fr: "Saskatchewan", ru: "Саскачеван" },
  MB: { en: "Manitoba", fr: "Manitoba", ru: "Манитоба" }, QC: { en: "Quebec", fr: "Québec", ru: "Квебек" },
  NB: { en: "New Brunswick", fr: "Nouveau-Brunswick", ru: "Нью-Брансуик" }, NS: { en: "Nova Scotia", fr: "Nouvelle-Écosse", ru: "Новая Шотландия" },
  PE: { en: "Prince Edward Island", fr: "Île-du-Prince-Édouard", ru: "Остров Принца Эдуарда" },
  NL: { en: "Newfoundland and Labrador", fr: "Terre-Neuve-et-Labrador", ru: "Ньюфаундленд и Лабрадор" },
  YT: { en: "Yukon", fr: "Yukon", ru: "Юкон" }, NT: { en: "Northwest Territories", fr: "Territoires du Nord-Ouest", ru: "Северо-Западные территории" }, NU: { en: "Nunavut", fr: "Nunavut", ru: "Нунавут" },
};

// Coarse boxes are used only to offer a suggestion. The user must confirm their work region.
const approximateBounds = {
  BC: [48.2, -139.1, 60.1, -114.0], AB: [49.0, -120.1, 60.0, -110.0], SK: [49.0, -110.1, 60.0, -101.3],
  MB: [49.0, -101.4, 60.0, -89.0], ON: [41.6, -95.2, 56.9, -74.2], QC: [45.0, -79.9, 62.6, -57.0],
  NB: [44.5, -69.2, 48.1, -63.7], NS: [43.3, -66.5, 47.2, -59.5], PE: [45.9, -64.5, 47.1, -61.9],
  NL: [46.4, -67.9, 60.5, -52.5], YT: [60.0, -141.1, 69.7, -123.8], NT: [60.0, -136.0, 78.8, -101.8], NU: [51.5, -120.0, 83.2, -60.0],
};

const key = "offday-poc-settings";
const saved = (() => { try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch { return {}; } })();
const calendarAliases = { ontario: "regionalEmployment", federal: "federalEmployment", publicService: "federalPublicService" };
const savedCalendar = calendarAliases[saved.calendar] || saved.calendar;
const detectedLanguage = (navigator.language || "en").slice(0, 2).toLowerCase();
const state = {
  language: ["en", "fr", "ru"].includes(saved.language) ? saved.language : (["en", "fr", "ru"].includes(detectedLanguage) ? detectedLanguage : "en"),
  calendar: ["regionalEmployment", "federalEmployment", "regionalPublicService", "federalPublicService"].includes(savedCalendar) ? savedCalendar : "regionalEmployment",
  province: provinceNames[saved.province] ? saved.province : "ON",
  showAll: false,
};

const $ = (selector) => document.querySelector(selector);
const dateOf = (date) => new Date(`${date}T12:00:00`);
const localToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
};
const daysBetween = (a, b) => Math.round((dateOf(b) - a) / 86400000);
const localeFor = (language) => ({ en: "en-CA", fr: "fr-CA", ru: "ru-CA" }[language]);
const fmt = (date, options) => new Intl.DateTimeFormat(localeFor(state.language), options).format(dateOf(date));
const trName = (name) => names[name]?.[state.language] || name;
const t = (id) => copy[state.language][id];
const save = () => localStorage.setItem(key, JSON.stringify({ language: state.language, calendar: state.calendar, province: state.province }));
const federalSources = {
  federalEmployment: "https://www.canada.ca/en/services/jobs/workplace/federal-labour-standards/vacations-holidays.html",
  federalPublicService: "https://www.canada.ca/en/public-services-procurement/services/pay-pension/pay-administration/access-update-pay-details/pay-changes-in-your-life/taking-leave/statutory-holiday-pay.html",
};

function eventsFor(calendar = state.calendar, province = state.province) {
  if (calendar === "federalEmployment") return holidayData.federalEmployment;
  if (calendar === "federalPublicService") return [...holidayData.federalPublicService, holidayData.federalPublicServiceRegionalHoliday[province]].sort((left, right) => left[0].localeCompare(right[0]));
  return holidayData[calendar][province] || [];
}

function sourceFor(calendar = state.calendar, province = state.province) {
  if (calendar === "federalEmployment" || calendar === "federalPublicService") return federalSources[calendar];
  const sourceType = calendar === "regionalEmployment" ? "employment" : "publicService";
  return holidayData.sources[sourceType][province];
}

function applyLanguage() {
  document.documentElement.lang = state.language;
  document.querySelectorAll("[data-i18n]").forEach((node) => { const value = t(node.dataset.i18n); if (value) node.textContent = value; });
  document.querySelectorAll("[data-i18n-aria]").forEach((node) => node.setAttribute("aria-label", t(node.dataset.i18nAria)));
  $("#region-select").setAttribute("aria-label", t("regionSelectLabel"));
  document.querySelectorAll("option[data-region]").forEach((option) => {
    const name = provinceNames[option.dataset.region][state.language];
    option.textContent = name;
  });
  $("#region-select").value = state.province;
  document.querySelectorAll("[data-language]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.language === state.language)));
  document.querySelectorAll(".calendar-tab[data-tab-label]").forEach((button) => button.setAttribute("aria-label", t(button.dataset.tabLabel)));
  render();
}

function upcomingEvents() {
  const today = localToday();
  return eventsFor()
    .map(([date, name, photo, noteKey]) => ({ date, name, photo, noteKey, days: daysBetween(today, date) }))
    .filter((event) => event.days >= 0)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function countdownLabel(days) {
  if (days === 0) return t("todayShort");
  if (days === 1) return t("tomorrow");
  return t("days").replace("{count}", String(days));
}

function creditMarkup(photo) {
  return `<span>${t("photoBy")} <a href="${photo.page}" target="_blank" rel="noopener noreferrer">${photo.credit} · ${t("unsplash")}</a></span>`;
}

function photoMarkup(photoKey, className = "") {
  const photo = photos[photoKey];
  return `<div class="${className}"><img src="${photo.url}" alt="${photo.alt[state.language]}" loading="lazy" referrerpolicy="no-referrer" /><span class="sr-only">${creditMarkup(photo)}</span></div>`;
}

function renderHero(event) {
  const target = $("#next-card");
  const today = localToday();
  const date = dateOf(event.date);
  const weekday = fmt(event.date, { weekday: "short" }).replace(/[.,]/g, "");
  const month = fmt(event.date, { month: "long" });
  const day = fmt(event.date, { day: "2-digit" });
  const year = fmt(event.date, { year: "numeric" });
  const meta = calendarMeta[state.calendar];
  const photo = photos[event.photo];
  target.innerHTML = `
    <div class="next-copy">
      <p class="eyebrow">${event.days === 0 ? t("today") : t("next")}</p>
      <div class="date-display" aria-label="${fmt(event.date, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}">
        <span class="date-day">${day}</span>
        <span class="date-side"><span class="date-weekday">${weekday}</span><span class="date-month">${month}</span><span class="date-year">${year}</span></span>
      </div>
      <h2 class="holiday-name">${trName(event.name)}</h2>
      <span class="countdown"><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>${countdownLabel(event.days)}</span>
      <div class="regime-line"><span class="regime-badge">${meta.label[state.language]}</span><br>${meta.context[state.language]}${event.noteKey ? `<span class="event-caveat">${t(event.noteKey)}</span>` : ""}</div>
    </div>
    <div class="next-photo"><img src="${photo.url}" alt="${photo.alt[state.language]}" fetchpriority="high" /><div class="photo-credit">${creditMarkup(photo)}</div></div>`;
  target.querySelector("img").addEventListener("error", () => {
    target.querySelector(".next-photo").innerHTML = `<div class="photo-placeholder">${t("imageFallback")}</div><div class="photo-credit">${creditMarkup(photo)}</div>`;
  }, { once: true });
}

function renderRows(events) {
  const list = $("#holiday-list");
  const visible = state.showAll ? events.slice(1) : events.slice(1, 7);
  if (!visible.length) {
    list.innerHTML = `<div class="empty-state">${t("empty")}</div>`;
    return;
  }
  const meta = calendarMeta[state.calendar];
  list.innerHTML = visible.map((event) => {
    const photo = photos[event.photo];
    const day = fmt(event.date, { day: "2-digit" });
    const month = fmt(event.date, { month: "short" }).replace(/[.,]/g, "");
    const dateText = fmt(event.date, { weekday: "short", month: "long", day: "numeric", year: "numeric" });
    return `<article class="holiday-row">
      <div class="row-date" aria-label="${dateText}"><strong>${day}</strong><span>${month}</span></div>
      <div class="row-details"><h3>${trName(event.name)}</h3><span class="row-regime">${meta.label[state.language]}</span>${event.noteKey ? `<span class="row-note">${t(event.noteKey)}</span>` : ""}</div>
      <a class="row-photo" href="${photo.page}" target="_blank" rel="noopener noreferrer" aria-label="${t("photoBy")} ${photo.credit} ${t("unsplash")}"><img src="${photo.url}" alt="${photo.alt[state.language]}" loading="lazy" /><span class="row-credit">${photo.credit} · Unsplash</span></a>
    </article>`;
  }).join("");
  list.querySelectorAll("img").forEach((img) => img.addEventListener("error", () => {
    img.hidden = true;
    img.closest(".row-photo").classList.add("image-unavailable");
    img.closest(".row-photo").querySelector(".row-credit").textContent = t("imageFallback");
  }, { once: true }));
}

function render() {
  const events = upcomingEvents();
  const tabs = [...document.querySelectorAll(".calendar-tab")];
  tabs.forEach((tab) => {
    const isActive = tab.dataset.calendar === state.calendar;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
    tab.tabIndex = isActive ? 0 : -1;
  });
  $("#calendar-panel").setAttribute("aria-labelledby", `tab-${state.calendar}`);
  $(".calendar-tabs").setAttribute("aria-label", t("calendarLabel"));
  $("#calendar-context").textContent = calendarMeta[state.calendar].context[state.language];
  $("#calendar-tabs").querySelectorAll(".calendar-tab").forEach((tab) => {
    const count = eventsFor(tab.dataset.calendar).filter(([date]) => daysBetween(localToday(), date) >= 0).length;
    tab.querySelector(".tab-count").textContent = count;
  });
  const sourceLink = $("#calendar-source");
  sourceLink.href = sourceFor();
  sourceLink.textContent = t("sourceLink");
  if (!events.length) {
    $("#next-card").innerHTML = `<div class="empty-state">${t("empty")}</div>`;
    $("#holiday-list").innerHTML = "";
  } else {
    renderHero(events[0]);
    renderRows(events);
  }
  const showAll = $("#show-all-button");
  showAll.hidden = events.length < 3;
  showAll.setAttribute("aria-expanded", String(state.showAll));
  showAll.innerHTML = `${state.showAll ? t("showLess") : t("showAll")} <span aria-hidden="true">↗</span>`;
}

let midnightTimer;
function scheduleMidnightRefresh() {
  clearTimeout(midnightTimer);
  const now = new Date();
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 2);
  midnightTimer = setTimeout(() => { render(); scheduleMidnightRefresh(); }, nextMidnight.getTime() - now.getTime());
}

function showLocationMessage(message) {
  const node = $("#location-message");
  node.textContent = message;
  node.hidden = false;
}

function suggestedRegions(latitude, longitude) {
  return Object.entries(approximateBounds)
    .filter(([, [south, west, north, east]]) => latitude >= south && latitude <= north && longitude >= west && longitude <= east)
    .map(([code]) => code);
}

function requestLocation() {
  if (!navigator.geolocation) {
    showLocationMessage(t("locationDenied"));
    return;
  }
  $("#location-button").disabled = true;
  $("#location-button span").textContent = t("locating");
  navigator.geolocation.getCurrentPosition(({ coords }) => {
    const matches = suggestedRegions(coords.latitude, coords.longitude);
    $("#location-button").disabled = false;
    $("#location-button span").textContent = t("location");
    if (matches.length > 1) {
      const labels = matches.map((code) => provinceNames[code][state.language]).join(state.language === "ru" ? " или " : ", ");
      showLocationMessage(t("locationAmbiguous").replace("{regions}", labels));
    } else if (matches.length === 1) {
      const province = matches[0];
      showLocationMessage(t("locationDetected").replace("{region}", provinceNames[province][state.language]));
    } else {
      showLocationMessage(t("locationNoMatch"));
    }
  }, () => {
    $("#location-button").disabled = false;
    $("#location-button span").textContent = t("location");
    showLocationMessage(t("locationDenied"));
  }, { enableHighAccuracy: false, timeout: 9000, maximumAge: 60000 });
}

document.querySelectorAll("[data-calendar]").forEach((button) => button.addEventListener("click", () => {
  state.calendar = button.dataset.calendar;
  state.showAll = false;
  save();
  render();
}));
document.querySelectorAll("[data-language]").forEach((button) => button.addEventListener("click", () => {
  state.language = button.dataset.language;
  save();
  applyLanguage();
}));
$("#region-select").addEventListener("change", (event) => {
  state.province = event.target.value;
  save();
  render();
});
$("#location-button").addEventListener("click", requestLocation);
$("#show-all-button").addEventListener("click", () => { state.showAll = !state.showAll; render(); });
document.querySelectorAll(".calendar-tab").forEach((tab, index, all) => tab.addEventListener("keydown", (event) => {
  if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
  event.preventDefault();
  const direction = event.key === "ArrowRight" ? 1 : -1;
  const next = all[(index + direction + all.length) % all.length];
  next.focus();
  next.click();
}));
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") render(); });

$("#region-select").value = state.province;
applyLanguage();
scheduleMidnightRefresh();
