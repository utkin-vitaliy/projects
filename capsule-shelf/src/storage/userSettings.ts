import type { Capsule, InventoryState } from "../domain/capsules";
import type { Locale } from "../i18n/locale";
import { parseInventoryBackup } from "./inventoryStorage";

export const USER_SETTINGS_FORMAT = "capsule-shelf-user-settings";
export const USER_SETTINGS_VERSION = 1;
export type CoffeeSystem = "original" | "vertuo";
export type InventoryFilter = "all" | "favorites" | "low";
export type InventoryFilterPreferences = Record<CoffeeSystem, InventoryFilter>;
export const DEFAULT_INVENTORY_FILTERS: InventoryFilterPreferences = { original: "all", vertuo: "all" };
export type RecipeFilter = "all" | "favorites" | "hot" | "cold";
export type RecipeFilterPreferences = Record<CoffeeSystem, RecipeFilter>;
export const DEFAULT_RECIPE_FILTERS: RecipeFilterPreferences = { original: "all", vertuo: "all" };
export type RecipeTextOverride = { title: string; ingredients: string[]; steps: string[] };
export type RecipeEdits = Record<string, Partial<Record<Locale, RecipeTextOverride>>>;

export type UserSettings = {
  format: typeof USER_SETTINGS_FORMAT;
  version: typeof USER_SETTINGS_VERSION;
  updatedAt: string;
  locale: Locale;
  system: CoffeeSystem;
  filters: InventoryFilterPreferences;
  recipeFilters: RecipeFilterPreferences;
  inventory: InventoryState;
  favoriteRecipes: string[];
  recipeEdits?: RecipeEdits;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "ru" || value === "fr";
}

function isCoffeeSystem(value: unknown): value is CoffeeSystem {
  return value === "original" || value === "vertuo";
}

function isInventoryFilter(value: unknown): value is InventoryFilter {
  return value === "all" || value === "favorites" || value === "low";
}

function parseInventoryFilters(value: unknown): InventoryFilterPreferences {
  if (!isRecord(value)) return { ...DEFAULT_INVENTORY_FILTERS };
  return {
    original: isInventoryFilter(value.original) ? value.original : "all",
    vertuo: isInventoryFilter(value.vertuo) ? value.vertuo : "all",
  };
}

function parseRecipeFilters(value: unknown): RecipeFilterPreferences {
  if (!isRecord(value)) return { ...DEFAULT_RECIPE_FILTERS };
  const isRecipeFilter = (filter: unknown): filter is RecipeFilter => filter === "all" || filter === "favorites" || filter === "hot" || filter === "cold";
  return {
    original: isRecipeFilter(value.original) ? value.original : "all",
    vertuo: isRecipeFilter(value.vertuo) ? value.vertuo : "all",
  };
}

function parseRecipeEdits(value: unknown, allowedRecipeIds: Set<string>): RecipeEdits {
  if (!isRecord(value)) return {};
  const result: RecipeEdits = {};
  for (const [recipeId, localeValues] of Object.entries(value)) {
    if (!allowedRecipeIds.has(recipeId) || !isRecord(localeValues)) continue;
    const parsedLocales: Partial<Record<Locale, RecipeTextOverride>> = {};
    for (const locale of ["en", "ru", "fr"] as const) {
      const edit = localeValues[locale];
      if (!isRecord(edit)) continue;
      const title = typeof edit.title === "string" ? edit.title.trim().slice(0, 120) : "";
      const ingredients = parseRecipeLines(edit.ingredients);
      const steps = parseRecipeLines(edit.steps);
      if (!title || !ingredients.length || !steps.length) continue;
      parsedLocales[locale] = { title, ingredients, steps };
    }
    if (Object.keys(parsedLocales).length) result[recipeId] = parsedLocales;
  }
  return result;
}

function parseRecipeLines(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > 30) return [];
  return value
    .filter((line): line is string => typeof line === "string")
    .map((line) => line.trim().slice(0, 240))
    .filter(Boolean)
    .slice(0, 30);
}

export function serializeUserSettings(settings: UserSettings): string {
  return JSON.stringify(settings, null, 2);
}

export function parseUserSettings(
  raw: string,
  catalog: Capsule[],
  recipeIds: string[],
  fallbackLocale: Locale = "en",
): UserSettings {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Файл не является корректным JSON.");
  }

  if (!isRecord(parsed)) throw new Error("Формат файла настроек не распознан.");

  const now = new Date().toISOString();
  const allowedRecipeIds = new Set(recipeIds);

  if (parsed.format !== USER_SETTINGS_FORMAT) {
    const inventory = parseInventoryBackup(catalog, raw);
    return {
      format: USER_SETTINGS_FORMAT,
      version: USER_SETTINGS_VERSION,
      updatedAt: now,
      locale: fallbackLocale,
      system: "original",
      filters: { ...DEFAULT_INVENTORY_FILTERS },
      recipeFilters: { ...DEFAULT_RECIPE_FILTERS },
      inventory,
      favoriteRecipes: [],
      recipeEdits: {},
    };
  }

  if (parsed.version !== USER_SETTINGS_VERSION || !isRecord(parsed.inventory)) {
    throw new Error("Формат файла настроек не распознан.");
  }

  const inventory = parseInventoryBackup(catalog, JSON.stringify({
    format: "capsule-shelf-settings",
    version: 1,
    inventory: parsed.inventory,
  }));
  const favoriteRecipes = Array.isArray(parsed.favoriteRecipes)
    ? [...new Set(parsed.favoriteRecipes.filter((id): id is string => typeof id === "string" && allowedRecipeIds.has(id)))]
    : [];
  const recipeEdits = parseRecipeEdits(parsed.recipeEdits, allowedRecipeIds);
  const updatedAt = typeof parsed.updatedAt === "string" && Number.isFinite(Date.parse(parsed.updatedAt))
    ? new Date(parsed.updatedAt).toISOString()
    : now;

  return {
    format: USER_SETTINGS_FORMAT,
    version: USER_SETTINGS_VERSION,
    updatedAt,
    locale: isLocale(parsed.locale) ? parsed.locale : "en",
    system: isCoffeeSystem(parsed.system) ? parsed.system : "original",
    filters: parseInventoryFilters(parsed.filters),
    recipeFilters: parseRecipeFilters(parsed.recipeFilters),
    inventory,
    favoriteRecipes,
    recipeEdits,
  };
}
