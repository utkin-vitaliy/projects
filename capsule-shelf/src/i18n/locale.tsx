import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { settingsStorageKey, type SettingsNamespace } from "../storage/settingsStorage";

export type Locale = "en" | "ru" | "fr";
export const LOCALE_STORAGE_KEY = "capsule-shelf:locale:v1";

const messages = {
  en: {
    language: "Language", russianName: "Russian", frenchName: "French", englishName: "English", title: "My Coffee Shelf", subtitle: "Favourite capsules, stock levels, and tasting notes — all in one place.",
    navAria: "App sections", inventoryTab: "Capsules", recipesTab: "Recipes", loading: "Loading your settings…", systemSelector: "Choose capsule system", originalSystem: "Original", vertuoSystem: "Vertuo", vertuoComingSoon: "The Vertuo catalogue is coming soon.",
    catalogTitle: "Coffee varieties", catalogHint: "Enter the number of capsules you have for each variety",
    browserStorage: "Settings are saved in this browser", settingsMenu: "Data", downloadSettings: "Export data", uploadFile: "Import data", fileInput: "Choose a Capsule Shelf backup file", catalogLink: "Nespresso Canada catalogue ↗", privacyPolicyLink: "Privacy policy", feedbackLink: "Leave feedback ↗", feedbackPrivacy: "Opens GitHub; your post will be public.",
    replaceSettings: "Replace your current settings with the data in this file?", readFileError: "Could not read the selected file.", invalidJson: "This file is not valid JSON.", invalidBackup: "The settings file format is not recognized.",
    summary: "Stock summary", total: "Total capsules", collection: "in your collection", varieties: "varieties in the catalogue", restockCount: "need to be restocked", restockVarieties: "Varieties to restock", favoritesEnding: "Your favourite capsules are running low", leftCount: "{name} — {count} in stock", allCalm: "All is well", calmTip: "Mark a variety as a favourite to track its stock.",
    filterAria: "Filter varieties", searchCapsules: "Find a capsule…", searchRecipes: "Find a recipe…", noSearchResults: "No matches found.", recipeImageUnavailable: "Recipe photo temporarily unavailable", allVarieties: "All varieties", favorites: "Favourites", restock: "Restock soon", category: "Category", categoryAria: "Filter by category", allCategories: "All categories", limited: "Limited editions", italian: "Italian inspirations", decaffeinated: "Decaffeinated", world: "World Explorations", origins: "Origins", flavoured: "Flavoured", classic: "Classics", emptyTitle: "Nothing here yet", emptyTip: "Mark a variety as a favourite or check your stock thresholds.",
    finished: "Out of stock", inStock: "In stock", addFavorite: "Add {name} to favourites", removeFavorite: "Remove {name} from favourites", favoriteTitleAdd: "Add to favourites", favoriteTitleRemove: "Remove from favourites", intensity: "Intensity {value} out of 13", imageUnavailable: "Variety photo temporarily unavailable", sourceLink: "Open the Nespresso source for {name} in a new tab", sourceTitle: "Nespresso source", capsuleFamily: "Original · Coffee capsules", capsuleFamilyVertuo: "Vertuo · Coffee capsules", cupSizeRistretto: "Ristretto", cupSizeEspresso: "Espresso", cupSizeDoubleEspresso: "Double espresso", cupSizeGranLungo: "Gran Lungo", cupSizeCoffee: "Coffee", cupSizeAlto: "Alto", recipesFor: "Recipes for {name} ({count})", recipeCount: "Recipes", manageStock: "Manage stock for {name}", reduceCapsule: "Remove one {name} capsule", addCapsule: "Add one {name} capsule", stock: "In stock", quantityLabel: "Capsule count for {name}", thresholdLabel: "Low stock threshold", remindAt: "Remind me at", noteAdded: "Personal note added", collapseNotes: "Collapse notes", myNotes: "My notes", notesButtonLabel: "Notes: {name}", addNote: "Add a note",
    notesAria: "Rating for {name}", impression: "Your impression", like: "Like", neutral: "Neutral", dislike: "Dislike", tastingNotes: "Tasting notes", tastingInputLabel: "Personal tasting note", tastingPlaceholder: "For example: smooth, with a chocolate finish", recipesLabel: "Recipes", recipesPlaceholder: "Cappuccino, iced latte…", suitableFor: "Works well for", suitablePlaceholder: "Espresso, milk-based drinks…", unsuitableFor: "Less suited to", unsuitablePlaceholder: "Long lungos, if you prefer a stronger coffee…", notesSaved: "Notes saved", saveNotes: "Save notes for {name}",
    recipeHeading: "Recipes for your shelf", temperatureFilter: "Filter by drink temperature", recipeFilterAria: "Filter recipes", allRecipes: "All recipes", favoriteRecipes: "Favourites", noFavoriteRecipes: "No favourite recipes yet. Select the heart on a recipe to save it.", addRecipeFavorite: "Add {name} to favourites", removeRecipeFavorite: "Remove {name} from favourites", all: "All", hot: "Hot", cold: "Cold", capsuleLabel: "Capsule:", ingredients: "Ingredients", preparation: "Method",
    storageNoticeUnavailable: "Browser storage is unavailable. Changes may not be saved after you close the page.", storageNoticeRead: "Could not read browser settings. Upload a backup or download the current data before continuing.", storageNoticeMigrated: "Settings were moved from the older browser storage.", storageNoticeSave: "Could not save data in this browser. Try downloading a backup.", storageNoticeSaveFull: "Could not save data in this browser. Download a backup and free up storage space.", storageNoticeLoaded: "Settings loaded into this browser.", storageNoticeImport: "Could not load the settings file.",
  },
  ru: {
    language: "Язык", russianName: "Русский", frenchName: "Французский", englishName: "Английский", title: "Моя кофейная полка", subtitle: "Любимые вкусы, свежий запас и заметки — всё на виду.",
    navAria: "Разделы приложения", inventoryTab: "Капсулы", recipesTab: "Рецепты", loading: "Загружаю настройки…", systemSelector: "Выбрать систему капсул", originalSystem: "Original", vertuoSystem: "Vertuo", vertuoComingSoon: "Каталог Vertuo скоро появится.",
    catalogTitle: "Сорта кофе", catalogHint: "Введи количество капсул для каждого сорта",
    browserStorage: "Настройки сохраняются в этом браузере", settingsMenu: "Данные", downloadSettings: "Экспорт данных", uploadFile: "Импорт данных", fileInput: "Выбрать файл резервной копии Capsule Shelf", catalogLink: "Каталог Nespresso Canada ↗", privacyPolicyLink: "Конфиденциальность", feedbackLink: "Оставить отзыв ↗", feedbackPrivacy: "Откроется GitHub; сообщение будет публичным.",
    replaceSettings: "Заменить текущие настройки данными из этого файла?", readFileError: "Не удалось прочитать выбранный файл.", invalidJson: "Файл не является корректным JSON.", invalidBackup: "Формат файла настроек не распознан.",
    summary: "Сводка запасов", total: "Всего капсул", collection: "в твоей коллекции", varieties: "сортов в каталоге", restockCount: "пора пополнить", restockVarieties: "Сорта, которым пора пополнить запас", favoritesEnding: "Любимые сорта заканчиваются", leftCount: "{name} — осталось {count}", allCalm: "Пока всё спокойно", calmTip: "Отметь любимый сорт — и запас будет под контролем.",
    filterAria: "Фильтр сортов", searchCapsules: "Найти капсулу…", searchRecipes: "Найти рецепт…", noSearchResults: "Ничего не найдено.", recipeImageUnavailable: "Фото рецепта временно недоступно", allVarieties: "Все сорта", favorites: "Избранное", restock: "Пора пополнить", category: "Категория", categoryAria: "Категория сортов", allCategories: "Все категории", limited: "Лимитированные", italian: "Итальянские", decaffeinated: "Без кофеина", world: "Кофейные культуры мира", origins: "Кофе по происхождению", flavoured: "Ароматизированные", classic: "Классика", emptyTitle: "Здесь пока пусто", emptyTip: "Отметь любимый сорт или проверь пороги запаса.",
    finished: "Закончился", inStock: "В запасе", addFavorite: "Добавить {name} в избранное", removeFavorite: "Убрать {name} из избранного", favoriteTitleAdd: "Добавить в избранное", favoriteTitleRemove: "Убрать из избранного", intensity: "Интенсивность {value} из 13", imageUnavailable: "Фото сорта временно недоступно", sourceLink: "Открыть источник Nespresso для {name} в новой вкладке", sourceTitle: "Источник Nespresso", capsuleFamily: "Original · Кофейные капсулы", capsuleFamilyVertuo: "Vertuo · Кофейные капсулы", cupSizeRistretto: "Ристретто", cupSizeEspresso: "Эспрессо", cupSizeDoubleEspresso: "Двойной эспрессо", cupSizeGranLungo: "Гран-лунго", cupSizeCoffee: "Кофе", cupSizeAlto: "Альто", recipesFor: "Рецепты для {name} ({count})", recipeCount: "Рецепты", manageStock: "Управление запасом капсул {name}", reduceCapsule: "Убрать одну капсулу {name}", addCapsule: "Добавить капсулу {name}", stock: "В наличии", quantityLabel: "Количество капсул {name}", thresholdLabel: "Порог запаса", remindAt: "Напомнить при", noteAdded: "Личная заметка добавлена", collapseNotes: "Свернуть заметки", myNotes: "Мои заметки", notesButtonLabel: "Заметки {name}", addNote: "Добавить заметку",
    notesAria: "Оценка {name}", impression: "Твоё впечатление", like: "Нравится", neutral: "Нейтрально", dislike: "Не нравится", tastingNotes: "Вкус по твоим ощущениям", tastingInputLabel: "Личная заметка о вкусе", tastingPlaceholder: "Например: мягкий, с шоколадным послевкусием", recipesLabel: "Рецепты", recipesPlaceholder: "Капучино, айс-латте…", suitableFor: "Подходит для", suitablePlaceholder: "Эспрессо, напитков с молоком…", unsuitableFor: "Не лучший выбор для", unsuitablePlaceholder: "Длинного лунго, если любишь покрепче…", notesSaved: "Заметки сохранены", saveNotes: "Сохранить заметки {name}",
    recipeHeading: "Рецепты для твоей полки", temperatureFilter: "Фильтр по температуре напитка", recipeFilterAria: "Фильтр рецептов", allRecipes: "Все рецепты", favoriteRecipes: "Избранное", noFavoriteRecipes: "Пока нет избранных рецептов. Нажми на сердечко в карточке, чтобы сохранить рецепт.", addRecipeFavorite: "Добавить рецепт «{name}» в избранное", removeRecipeFavorite: "Убрать рецепт «{name}» из избранного", all: "Все", hot: "Горячие", cold: "Холодные", capsuleLabel: "Капсула:", ingredients: "Ингредиенты", preparation: "Приготовление",
    storageNoticeUnavailable: "Браузерное хранилище недоступно. Изменения могут не сохраниться после закрытия страницы.", storageNoticeRead: "Не удалось прочитать настройки браузера. Загрузи резервную копию или скачай текущие данные перед продолжением.", storageNoticeMigrated: "Настройки перенесены из старого браузерного хранилища.", storageNoticeSave: "Не удалось сохранить данные в браузере. Попробуй скачать резервную копию.", storageNoticeSaveFull: "Не удалось сохранить данные в браузере. Скачай резервную копию и освободи место в хранилище.", storageNoticeLoaded: "Настройки загружены в этот браузер.", storageNoticeImport: "Не удалось загрузить файл настроек.",
  },
  fr: {
    language: "Langue", russianName: "Russe", frenchName: "Français", englishName: "Anglais", title: "Ma collection de cafés", subtitle: "Vos capsules préférées, vos stocks et vos notes de dégustation — tout au même endroit.",
    navAria: "Sections de l’application", inventoryTab: "Capsules", recipesTab: "Recettes", loading: "Chargement de vos paramètres…", systemSelector: "Choisir un système de capsules", originalSystem: "Original", vertuoSystem: "Vertuo", vertuoComingSoon: "Le catalogue Vertuo sera bientôt disponible.",
    catalogTitle: "Variétés de café", catalogHint: "Indiquez le nombre de capsules que vous avez pour chaque variété",
    browserStorage: "Les paramètres sont enregistrés dans ce navigateur", settingsMenu: "Données", downloadSettings: "Exporter les données", uploadFile: "Importer les données", fileInput: "Choisir un fichier de sauvegarde Capsule Shelf", catalogLink: "Catalogue Nespresso Canada ↗", privacyPolicyLink: "Confidentialité", feedbackLink: "Partager vos commentaires ↗", feedbackPrivacy: "GitHub s’ouvrira ; votre message sera public.",
    replaceSettings: "Remplacer vos paramètres actuels par les données de ce fichier ?", readFileError: "Impossible de lire le fichier sélectionné.", invalidJson: "Ce fichier n’est pas un JSON valide.", invalidBackup: "Le format du fichier de paramètres n’est pas reconnu.",
    summary: "Résumé des stocks", total: "Total des capsules", collection: "dans votre collection", varieties: "variétés au catalogue", restockCount: "à réapprovisionner", restockVarieties: "Variétés à réapprovisionner", favoritesEnding: "Il reste peu de capsules de vos variétés préférées", leftCount: "{name} — {count} en stock", allCalm: "Tout va bien", calmTip: "Ajoutez une variété à vos favoris pour suivre son niveau de stock.",
    filterAria: "Filtrer les variétés", searchCapsules: "Rechercher une capsule…", searchRecipes: "Rechercher une recette…", noSearchResults: "Aucun résultat.", recipeImageUnavailable: "Photo de recette temporairement indisponible", allVarieties: "Toutes les variétés", favorites: "Favoris", restock: "À réapprovisionner", category: "Catégorie", categoryAria: "Filtrer par catégorie", allCategories: "Toutes les catégories", limited: "Éditions limitées", italian: "Inspirations italiennes", decaffeinated: "Décaféinés", world: "Explorations du monde", origins: "Origines", flavoured: "Aromatisés", classic: "Classiques", emptyTitle: "Rien à afficher pour le moment", emptyTip: "Ajoutez une variété aux favoris ou vérifiez vos seuils de stock.",
    finished: "Épuisé", inStock: "En stock", addFavorite: "Ajouter {name} aux favoris", removeFavorite: "Retirer {name} des favoris", favoriteTitleAdd: "Ajouter aux favoris", favoriteTitleRemove: "Retirer des favoris", intensity: "Intensité : {value} sur 13", imageUnavailable: "Photo de la variété temporairement indisponible", sourceLink: "Ouvrir la page Nespresso consacrée à {name} dans un nouvel onglet", sourceTitle: "Source Nespresso", capsuleFamily: "Original · Capsules de café", capsuleFamilyVertuo: "Vertuo · Capsules de café", cupSizeRistretto: "Ristretto", cupSizeEspresso: "Espresso", cupSizeDoubleEspresso: "Double espresso", cupSizeGranLungo: "Gran Lungo", cupSizeCoffee: "Café", cupSizeAlto: "Alto", recipesFor: "Recettes avec {name} ({count})", recipeCount: "Recettes", manageStock: "Gérer le stock : {name}", reduceCapsule: "Retirer une capsule de {name}", addCapsule: "Ajouter une capsule de {name}", stock: "En stock", quantityLabel: "Nombre de capsules de {name}", thresholdLabel: "Seuil d’alerte", remindAt: "M’alerter lorsqu’il en reste", noteAdded: "Note personnelle ajoutée", collapseNotes: "Replier les notes", myNotes: "Mes notes", notesButtonLabel: "Notes : {name}", addNote: "Ajouter une note",
    notesAria: "Évaluation de {name}", impression: "Votre avis", like: "J’aime", neutral: "Neutre", dislike: "Je n’aime pas", tastingNotes: "Notes de dégustation", tastingInputLabel: "Note de dégustation personnelle", tastingPlaceholder: "Par exemple : doux, avec une finale chocolatée", recipesLabel: "Recettes", recipesPlaceholder: "Cappuccino, latte glacé…", suitableFor: "Idéal pour", suitablePlaceholder: "Espresso, boissons lactées…", unsuitableFor: "Moins adapté aux", unsuitablePlaceholder: "Lungo, si vous aimez les cafés corsés…", notesSaved: "Notes enregistrées", saveNotes: "Enregistrer les notes : {name}",
    recipeHeading: "Recettes à préparer avec vos capsules", temperatureFilter: "Filtrer selon la température", recipeFilterAria: "Filtrer les recettes", allRecipes: "Toutes les recettes", favoriteRecipes: "Favoris", noFavoriteRecipes: "Aucune recette dans vos favoris pour le moment. Cliquez sur le cœur d’une recette pour l’ajouter à vos favoris.", addRecipeFavorite: "Ajouter {name} aux favoris", removeRecipeFavorite: "Retirer {name} des favoris", all: "Tout", hot: "Chaudes", cold: "Froides", capsuleLabel: "Capsule :", ingredients: "Ingrédients", preparation: "Préparation",
    storageNoticeUnavailable: "Le stockage du navigateur est indisponible. Les changements risquent de ne pas être conservés après la fermeture de la page.", storageNoticeRead: "Impossible de lire les paramètres du navigateur. Importez une sauvegarde ou téléchargez les données actuelles avant de continuer.", storageNoticeMigrated: "Les paramètres ont été transférés depuis l’ancien stockage du navigateur.", storageNoticeSave: "Impossible d’enregistrer les données dans ce navigateur. Essayez de télécharger une sauvegarde.", storageNoticeSaveFull: "Impossible d’enregistrer les données dans ce navigateur. Téléchargez une sauvegarde et libérez de l’espace.", storageNoticeLoaded: "Paramètres importés dans ce navigateur.", storageNoticeImport: "Impossible de charger le fichier de paramètres.",
  },
} as const;

export type MessageKey = keyof typeof messages.en;
export function detectLocale(languages: readonly string[]): Locale {
  for (const language of languages) {
    const base = language.toLowerCase().split(/[-_]/)[0];
    if (base === "en" || base === "ru" || base === "fr") return base;
  }
  return "en";
}

function initialLocale(storageKey = LOCALE_STORAGE_KEY): Locale {
  try {
    const saved = window.localStorage.getItem(storageKey);
    if (saved === "en" || saved === "ru" || saved === "fr") return saved;
  } catch {
    // The language selector still works for this session if storage is blocked.
  }
  const browserLanguages = navigator.languages?.length ? navigator.languages : [navigator.language];
  return detectLocale(browserLanguages);
}

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, values?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children, storageNamespace = null }: { children: ReactNode; storageNamespace?: SettingsNamespace }) {
  const storageKey = settingsStorageKey(LOCALE_STORAGE_KEY, storageNamespace);
  const [locale, setLocaleState] = useState<Locale>(() => initialLocale(storageKey));
  const [hydratedStorageKey, setHydratedStorageKey] = useState(storageKey);

  useEffect(() => {
    setLocaleState(initialLocale(storageKey));
    setHydratedStorageKey(storageKey);
  }, [storageKey]);

  useEffect(() => {
    if (hydratedStorageKey !== storageKey) return;
    document.documentElement.lang = locale;
    try {
      window.localStorage.setItem(storageKey, locale);
    } catch {
      // Keep the selected language in memory when browser storage is blocked.
    }
  }, [locale, storageKey, hydratedStorageKey]);

  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    setLocale: setLocaleState,
    t: (key, values = {}) => messages[locale][key].replace(/\{(\w+)\}/g, (_, name: string) => String(values[name] ?? "")),
  }), [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used inside LocaleProvider");
  return context;
}
