import {
  createEmptyInventoryEntry,
  DEFAULT_LOW_STOCK_THRESHOLD,
  type Capsule,
  type CapsuleNote,
  type CapsuleRating,
  type InventoryEntry,
  type InventoryState,
} from "../domain/capsules";

export const STORAGE_VERSION = 1;
const ratings: CapsuleRating[] = ["like", "neutral", "dislike", null];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validCount(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function normalizeNote(value: unknown, fallback: CapsuleNote): CapsuleNote {
  if (!isRecord(value)) return fallback;
  const rating = ratings.includes(value.rating as CapsuleRating) ? value.rating as CapsuleRating : null;
  return {
    rating,
    tastingNotes: typeof value.tastingNotes === "string" ? value.tastingNotes : "",
    recipes: typeof value.recipes === "string" ? value.recipes : "",
    suitableFor: typeof value.suitableFor === "string" ? value.suitableFor : "",
    unsuitableFor: typeof value.unsuitableFor === "string" ? value.unsuitableFor : "",
  };
}

function normalizeEntry(value: unknown): InventoryEntry {
  const fallback = createEmptyInventoryEntry();
  if (!isRecord(value)) return fallback;
  return {
    quantity: validCount(value.quantity) ? value.quantity : 0,
    favorite: typeof value.favorite === "boolean" ? value.favorite : false,
    threshold: validCount(value.threshold) ? value.threshold : DEFAULT_LOW_STOCK_THRESHOLD,
    note: normalizeNote(value.note, fallback.note),
  };
}

export function loadInventory(catalog: Capsule[], raw: string | null, preserveUnknown = false): InventoryState {
  const inventory: InventoryState = Object.fromEntries(
    catalog.map(({ id }) => [id, createEmptyInventoryEntry()]),
  );

  try {
    if (!raw) return inventory;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.version !== STORAGE_VERSION || !isRecord(parsed.inventory)) return inventory;
    if (preserveUnknown) {
      for (const [id, entry] of Object.entries(parsed.inventory)) {
        if (!Object.hasOwn(inventory, id)) inventory[id] = normalizeEntry(entry);
      }
    }
    for (const capsule of catalog) {
      if (Object.hasOwn(parsed.inventory, capsule.id)) {
        inventory[capsule.id] = normalizeEntry(parsed.inventory[capsule.id]);
      }
    }
  } catch {
    return inventory;
  }

  return inventory;
}

export function serializeInventory(inventory: InventoryState): string {
  return JSON.stringify({ format: "capsule-shelf-settings", version: STORAGE_VERSION, inventory }, null, 2);
}

export function parseInventoryBackup(catalog: Capsule[], raw: string): InventoryState {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Файл не является корректным JSON.");
  }

  if (!isRecord(parsed)
    || parsed.version !== STORAGE_VERSION
    || !isRecord(parsed.inventory)
    || (parsed.format !== undefined && parsed.format !== "capsule-shelf-settings")) {
    throw new Error("Формат файла настроек не распознан.");
  }

  return loadInventory(catalog, raw, true);
}
