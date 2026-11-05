import { useEffect, useMemo, useRef, useState } from "react";
import { capsules } from "../../data/capsules";
import type { Capsule, CapsuleCategory } from "../../domain/capsules";
import { getLowStockCapsuleIds } from "../../domain/inventory";
import { createEmptyInventoryEntry, DEFAULT_LOW_STOCK_THRESHOLD, type CapsuleNote, type InventoryState } from "../../domain/capsules";
import { loadInventory, parseInventoryBackup, serializeInventory } from "../../storage/inventoryStorage";
import { settingsStorageKey, type SettingsNamespace } from "../../storage/settingsStorage";

import type { InventoryFilter } from "../../storage/userSettings";
export type { InventoryFilter } from "../../storage/userSettings";
export type CategoryFilter = CapsuleCategory | "all";
const LEGACY_STORAGE_KEY = "capsule-shelf:inventory:v1";
const LOCAL_STORAGE_KEY = "capsule-shelf:inventory:v2";

function createCatalogInventory(catalog: Capsule[]): InventoryState {
  return Object.fromEntries(catalog.map(({ id }) => [id, createEmptyInventoryEntry()]));
}

export function useInventory(namespace: SettingsNamespace = null, storageCatalog: Capsule[] = capsules, visibleCatalog: Capsule[] = storageCatalog) {
  const [inventory, setInventory] = useState<InventoryState>(() => createCatalogInventory(storageCatalog));
  const [filter, setFilter] = useState<InventoryFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [storageNotice, setStorageNotice] = useState("");
  const [ready, setReady] = useState(false);
  const [readyStorageKey, setReadyStorageKey] = useState("");
  const persistenceEnabled = useRef(false);
  const skipInitialWrite = useRef(true);
  const unlistedInventory = useRef<InventoryState>({});
  const lowStockIds = useMemo(() => getLowStockCapsuleIds(visibleCatalog, inventory), [visibleCatalog, inventory]);
  const lowStockSet = useMemo(() => new Set(lowStockIds), [lowStockIds]);
  const totalCapsules = useMemo(() => visibleCatalog.reduce((total, capsule) => total + (inventory[capsule.id]?.quantity ?? 0), 0), [visibleCatalog, inventory]);
  const inventoryStorageKey = settingsStorageKey(LOCAL_STORAGE_KEY, namespace);
  const legacyStorageKey = namespace ? null : LEGACY_STORAGE_KEY;

  useEffect(() => {
    let active = true;
    setReady(false);
    persistenceEnabled.current = false;

    async function hydrate() {
      let persistedInventory = createCatalogInventory(storageCatalog);
      let localStorageAvailable = false;
      let notice = "";
      let localRaw: string | null = null;

      try {
          localRaw = window.localStorage.getItem(inventoryStorageKey);
      } catch {
        notice = "Браузерное хранилище недоступно. Изменения могут не сохраниться после закрытия страницы.";
      }

      if (localRaw !== null) {
        try {
          persistedInventory = parseInventoryBackup(storageCatalog, localRaw);
          localStorageAvailable = true;
        } catch {
          notice = "Не удалось прочитать настройки браузера. Загрузи резервную копию или скачай текущие данные перед продолжением.";
        }
      } else {
        let legacyRaw: string | null = null;
        try {
          legacyRaw = legacyStorageKey ? window.localStorage.getItem(legacyStorageKey) : null;
        } catch {
          // If browser storage is blocked, continue with an in-memory empty inventory.
        }
        if (legacyRaw !== null) {
          persistedInventory = loadInventory(storageCatalog, legacyRaw, true);
          notice = "Настройки перенесены из старого браузерного хранилища.";
        }

        try {
          window.localStorage.setItem(inventoryStorageKey, serializeInventory(persistedInventory));
          localStorageAvailable = true;
          try {
            if (legacyStorageKey) window.localStorage.removeItem(legacyStorageKey);
          } catch {
            // Keep the original legacy copy if the browser refuses to remove it.
          }
        } catch {
          notice = "Не удалось сохранить данные в браузере. Попробуй скачать резервную копию.";
        }
      }

      if (!active) return;
      const catalogIds = new Set(storageCatalog.map(({ id }) => id));
      unlistedInventory.current = Object.fromEntries(
        Object.entries(persistedInventory).filter(([id]) => !catalogIds.has(id)),
      );
      const currentInventory = createCatalogInventory(storageCatalog);
      for (const capsule of storageCatalog) {
        if (Object.hasOwn(persistedInventory, capsule.id)) currentInventory[capsule.id] = persistedInventory[capsule.id];
      }

      persistenceEnabled.current = localStorageAvailable;
      skipInitialWrite.current = true;
      setInventory(currentInventory);
      setStorageNotice(notice);
      setReadyStorageKey(inventoryStorageKey);
      setReady(true);
    }

    void hydrate();
    return () => { active = false; };
  }, [inventoryStorageKey, legacyStorageKey, storageCatalog]);

  useEffect(() => {
    if (!ready || !persistenceEnabled.current) return;
    if (skipInitialWrite.current) {
      skipInitialWrite.current = false;
      return;
    }

    const timeout = window.setTimeout(() => {
      const completeInventory = { ...unlistedInventory.current, ...inventory };
      try {
        window.localStorage.setItem(inventoryStorageKey, serializeInventory(completeInventory));
        setStorageNotice("");
      } catch {
        persistenceEnabled.current = false;
        setStorageNotice("Не удалось сохранить данные в браузере. Скачай резервную копию и освободи место в хранилище.");
      }
    }, 120);
    return () => window.clearTimeout(timeout);
  }, [inventory, ready, inventoryStorageKey]);

  function exportInventory(): InventoryState {
    return { ...unlistedInventory.current, ...inventory };
  }

  function importInventory(raw: string): boolean {
    let imported: InventoryState;
    try {
      imported = parseInventoryBackup(storageCatalog, raw);
      window.localStorage.setItem(inventoryStorageKey, serializeInventory(imported));
    } catch (error) {
      setStorageNotice(error instanceof Error ? error.message : "Не удалось загрузить файл настроек.");
      return false;
    }

    const catalogIds = new Set(storageCatalog.map(({ id }) => id));
    unlistedInventory.current = Object.fromEntries(
      Object.entries(imported).filter(([id]) => !catalogIds.has(id)),
    );
    const currentInventory = createCatalogInventory(storageCatalog);
    for (const capsule of storageCatalog) {
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

  const visibleCapsules = useMemo(() => visibleCatalog
    .filter((capsule) => {
      const entry = inventory[capsule.id] ?? createEmptyInventoryEntry();
      if (categoryFilter !== "all" && capsule.category !== categoryFilter) return false;
      if (filter === "favorites") return entry.favorite;
      if (filter === "low") return lowStockSet.has(capsule.id);
      return true;
    }), [filter, categoryFilter, inventory, lowStockSet, visibleCatalog]);

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
    readyForNamespace: ready && readyStorageKey === inventoryStorageKey,
    exportInventory,
    importInventory,
    changeQuantity,
    toggleFavorite,
    updateThreshold,
    saveNote,
  };
}
