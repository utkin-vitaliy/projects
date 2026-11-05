import type { Capsule, InventoryState } from "../domain/capsules";
import type { Locale } from "../i18n/locale";
import { parseInventoryBackup } from "./inventoryStorage";

export const USER_SETTINGS_FORMAT = "capsule-shelf-user-settings";
export const USER_SETTINGS_VERSION = 1;
export type CoffeeSystem = "original" | "vertuo";

export type UserSettings = {
  format: typeof USER_SETTINGS_FORMAT;
  version: typeof USER_SETTINGS_VERSION;
  updatedAt: string;
  locale: Locale;
  system: CoffeeSystem;
  inventory: InventoryState;
  favoriteRecipes: string[];
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
      inventory,
      favoriteRecipes: [],
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
  const updatedAt = typeof parsed.updatedAt === "string" && Number.isFinite(Date.parse(parsed.updatedAt))
    ? new Date(parsed.updatedAt).toISOString()
    : now;

  return {
    format: USER_SETTINGS_FORMAT,
    version: USER_SETTINGS_VERSION,
    updatedAt,
    locale: isLocale(parsed.locale) ? parsed.locale : "en",
    system: isCoffeeSystem(parsed.system) ? parsed.system : "original",
    inventory,
    favoriteRecipes,
  };
}
