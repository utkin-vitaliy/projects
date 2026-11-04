import { useEffect, useMemo, useRef, useState } from "react";
import { capsules } from "../../data/capsules";
import type { CapsuleCategory } from "../../domain/capsules";
import { getLowStockCapsuleIds, getTotalCapsules } from "../../domain/inventory";
import { createEmptyInventoryEntry, DEFAULT_LOW_STOCK_THRESHOLD, type CapsuleNote, type InventoryState } from "../../domain/capsules";
import { loadInventory, parseInventoryBackup, serializeInventory } from "../../storage/inventoryStorage";

export type InventoryFilter = "all" | "favorites" | "low";
export type CategoryFilter = CapsuleCategory | "all";
const LEGACY_STORAGE_KEY = "capsule-shelf:inventory:v1";
const LOCAL_STORAGE_KEY = "capsule-shelf:inventory:v2";

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
      let persistedInventory = createCatalogInventory();
      let localStorageAvailable = false;
      let notice = "";
      let localRaw: string | null = null;

      try {
        localRaw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      } catch {
        notice = "Браузерное хранилище недоступно. Изменения могут не сохраниться после закрытия страницы.";
      }

      if (localRaw !== null) {
        try {
          persistedInventory = parseInventoryBackup(capsules, localRaw);
          localStorageAvailable = true;
        } catch {
          notice = "Не удалось прочитать настройки браузера. Загрузи резервную копию или скачай текущие данные перед продолжением.";
        }
      } else {
        let legacyRaw: string | null = null;
        try {
          legacyRaw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
        } catch {
          // If browser storage is blocked, continue with an in-memory empty inventory.
        }
        if (legacyRaw !== null) {
          persistedInventory = loadInventory(capsules, legacyRaw, true);
          notice = "Настройки перенесены из старого браузерного хранилища.";
        }

        try {
          window.localStorage.setItem(LOCAL_STORAGE_KEY, serializeInventory(persistedInventory));
          localStorageAvailable = true;
          try {
            window.localStorage.removeItem(LEGACY_STORAGE_KEY);
          } catch {
            // Keep the original legacy copy if the browser refuses to remove it.
          }
        } catch {
          notice = "Не удалось сохранить данные в браузере. Попробуй скачать резервную копию.";
        }
      }

      if (!active) return;
      const catalogIds = new Set(capsules.map(({ id }) => id));
      unlistedInventory.current = Object.fromEntries(
        Object.entries(persistedInventory).filter(([id]) => !catalogIds.has(id)),
      );
      const currentInventory = createCatalogInventory();
      for (const capsule of capsules) {
        if (Object.hasOwn(persistedInventory, capsule.id)) currentInventory[capsule.id] = persistedInventory[capsule.id];
      }

      persistenceEnabled.current = localStorageAvailable;
      skipInitialWrite.current = true;
      setInventory(currentInventory);
      setStorageNotice(notice);
      setReady(true);
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
      try {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, serializeInventory(completeInventory));
        setStorageNotice("");
      } catch {
        persistenceEnabled.current = false;
        setStorageNotice("Не удалось сохранить данные в браузере. Скачай резервную копию и освободи место в хранилище.");
      }
    }, 120);
    return () => window.clearTimeout(timeout);
  }, [inventory, ready]);

  function exportInventory(): InventoryState {
    return { ...unlistedInventory.current, ...inventory };
  }

  function importInventory(raw: string): boolean {
    let imported: InventoryState;
    try {
      imported = parseInventoryBackup(capsules, raw);
      window.localStorage.setItem(LOCAL_STORAGE_KEY, serializeInventory(imported));
    } catch (error) {
      setStorageNotice(error instanceof Error ? error.message : "Не удалось загрузить файл настроек.");
      return false;
    }

    const catalogIds = new Set(capsules.map(({ id }) => id));
    unlistedInventory.current = Object.fromEntries(
      Object.entries(imported).filter(([id]) => !catalogIds.has(id)),
    );
    const currentInventory = createCatalogInventory();
    for (const capsule of capsules) {
      if (Object.hasOwn(imported, capsule.id)) currentInventory[capsule.id] = imported[capsule.id];
    }
    persistenceEnabled.current = true;
    skipInitialWrite.current = true;
    setInventory(currentInventory);
    setStorageNotice("Настройки загружены в этот браузер.");
    return true;
  }

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
    exportInventory,
    importInventory,
    changeQuantity,
    toggleFavorite,
    updateThreshold,
    saveNote,
  };
}
