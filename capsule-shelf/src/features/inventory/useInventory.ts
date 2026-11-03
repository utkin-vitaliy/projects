import { useEffect, useMemo, useRef, useState } from "react";
import { capsules } from "../../data/capsules";
import type { CapsuleCategory } from "../../domain/capsules";
import { getLowStockCapsuleIds, getTotalCapsules } from "../../domain/inventory";
import { createEmptyInventoryEntry, DEFAULT_LOW_STOCK_THRESHOLD, type CapsuleNote, type InventoryState } from "../../domain/capsules";
import { readInventory, writeInventory } from "../../storage/inventoryApi";
import { loadInventory } from "../../storage/inventoryStorage";

export type InventoryFilter = "all" | "favorites" | "low";
export type CategoryFilter = CapsuleCategory | "all";
const LEGACY_STORAGE_KEY = "capsule-shelf:inventory:v1";

function createCatalogInventory(): InventoryState {
  return Object.fromEntries(capsules.map(({ id }) => [id, createEmptyInventoryEntry()]));
}

export function useInventory() {
  const [inventory, setInventory] = useState<InventoryState>(createCatalogInventory);
  const [filter, setFilter] = useState<InventoryFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [storageNotice, setStorageNotice] = useState("");
  const [ready, setReady] = useState(false);
  const persistenceEnabled = useRef(false);
  const skipInitialWrite = useRef(true);
  const unlistedInventory = useRef<InventoryState>({});
  const lowStockIds = useMemo(() => getLowStockCapsuleIds(capsules, inventory), [inventory]);
  const lowStockSet = useMemo(() => new Set(lowStockIds), [lowStockIds]);
  const totalCapsules = useMemo(() => getTotalCapsules(inventory), [inventory]);

  useEffect(() => {
    let active = true;

    async function hydrate() {
      let migrationInventory: InventoryState | null = null;
      try {
        const stored = await readInventory();
        if (!active) return;

        let persistedInventory = stored.inventory;
        if (!stored.exists) {
          let legacyRaw: string | null = null;
          try {
            legacyRaw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
          } catch {
            // Browser storage is only consulted for one-time migration; the file remains the normal store.
          }
          persistedInventory = loadInventory(capsules, legacyRaw, true);
          migrationInventory = persistedInventory;
          await writeInventory(persistedInventory);
          if (!active) return;
          if (legacyRaw !== null) {
            try {
              window.localStorage.removeItem(LEGACY_STORAGE_KEY);
            } catch {
              setStorageNotice("Данные сохранены в файл, но старую копию браузера не удалось удалить.");
            }
          }
        }

        const catalogIds = new Set(capsules.map(({ id }) => id));
        unlistedInventory.current = Object.fromEntries(
          Object.entries(persistedInventory).filter(([id]) => !catalogIds.has(id)),
        );
        const currentInventory = createCatalogInventory();
        for (const capsule of capsules) {
          if (Object.hasOwn(persistedInventory, capsule.id)) currentInventory[capsule.id] = persistedInventory[capsule.id];
        }

        persistenceEnabled.current = true;
        skipInitialWrite.current = true;
        setInventory(currentInventory);
        setStorageNotice((current) => current.startsWith("Данные сохранены") ? current : "");
        setReady(true);
      } catch {
        if (!active) return;
        persistenceEnabled.current = false;
        if (migrationInventory) {
          const visibleInventory = createCatalogInventory();
          for (const capsule of capsules) {
            if (Object.hasOwn(migrationInventory, capsule.id)) visibleInventory[capsule.id] = migrationInventory[capsule.id];
          }
          setInventory(visibleInventory);
        }
        setStorageNotice(migrationInventory
          ? "Не удалось перенести данные в JSON-файл. Старая копия браузера сохранена."
          : "Файл данных недоступен. Изменения будут доступны только до закрытия приложения.");
        setReady(true);
      }
    }

    void hydrate();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!ready || !persistenceEnabled.current) return;
    if (skipInitialWrite.current) {
      skipInitialWrite.current = false;
      return;
    }

    const timeout = window.setTimeout(() => {
      const completeInventory = { ...unlistedInventory.current, ...inventory };
      void writeInventory(completeInventory)
        .then(() => setStorageNotice(""))
        .catch(() => setStorageNotice("Не удалось сохранить данные в JSON-файл."));
    }, 120);
    return () => window.clearTimeout(timeout);
  }, [inventory, ready]);

  function updateEntry(capsuleId: string, patch: Partial<ReturnType<typeof createEmptyInventoryEntry>>) {
    setInventory((current) => ({
      ...current,
      [capsuleId]: { ...createEmptyInventoryEntry(), ...current[capsuleId], ...patch },
    }));
  }

  function changeQuantity(capsuleId: string, quantity: number) {
    if (!Number.isSafeInteger(quantity) || quantity < 0) return;
    setInventory((current) => ({
      ...current,
      [capsuleId]: {
        ...createEmptyInventoryEntry(),
        ...current[capsuleId],
        quantity,
      },
    }));
  }

  function toggleFavorite(capsuleId: string) {
    const current = inventory[capsuleId] ?? createEmptyInventoryEntry();
    updateEntry(capsuleId, {
      favorite: !current.favorite,
      threshold: current.threshold ?? DEFAULT_LOW_STOCK_THRESHOLD,
    });
  }

  function updateThreshold(capsuleId: string, threshold: number) {
    if (!Number.isSafeInteger(threshold) || threshold < 0) return;
    updateEntry(capsuleId, { threshold });
  }

  function saveNote(capsuleId: string, note: CapsuleNote) {
    updateEntry(capsuleId, { note });
  }

  const visibleCapsules = useMemo(() => capsules
    .filter((capsule) => {
      const entry = inventory[capsule.id] ?? createEmptyInventoryEntry();
      if (categoryFilter !== "all" && capsule.category !== categoryFilter) return false;
      if (filter === "favorites") return entry.favorite;
      if (filter === "low") return lowStockSet.has(capsule.id);
      return true;
    })
    .sort((left, right) => {
      const priority = (id: string) => lowStockSet.has(id) ? 0 : inventory[id]?.favorite ? 1 : 2;
      return priority(left.id) - priority(right.id);
    }), [filter, categoryFilter, inventory, lowStockSet]);

  return {
    capsules: visibleCapsules,
    inventory,
    filter,
    setFilter,
    categoryFilter,
    setCategoryFilter,
    lowStockIds,
    totalCapsules,
    storageNotice,
    ready,
    changeQuantity,
    toggleFavorite,
    updateThreshold,
    saveNote,
  };
}
