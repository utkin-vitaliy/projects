import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { CapsuleGrid } from "./components/CapsuleGrid";
import { InventoryFilters } from "./components/InventoryFilters";
import { InventorySummary } from "./components/InventorySummary";
import { RecipesPage } from "./components/RecipesPage";
import { capsules as fullCatalog } from "./data/capsules";
import { useInventory } from "./features/inventory/useInventory";
import { parseInventoryBackup, serializeInventory } from "./storage/inventoryStorage";
import { localizeCapsule } from "./i18n/catalogContent";
import { LocaleProvider, useLocale, type Locale, type MessageKey } from "./i18n/locale";

export default function App() {
  return <LocaleProvider><CapsuleShelfApp /></LocaleProvider>;
}

function CapsuleShelfApp() {
  const { locale, setLocale, t } = useLocale();
  const [activeView, setActiveView] = useState<"inventory" | "recipes">("inventory");
  const [pendingRecipeId, setPendingRecipeId] = useState<string | null>(null);
  const settingsFileInput = useRef<HTMLInputElement>(null);
  const {
    capsules,
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
  } = useInventory();
  const localizedCatalog = useMemo(() => fullCatalog.map((capsule) => localizeCapsule(capsule, locale)), [locale]);
  const localizedCapsules = useMemo(() => capsules.map((capsule) => localizeCapsule(capsule, locale)), [capsules, locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  function openRecipe(recipeId: string) {
    setPendingRecipeId(recipeId);
    setActiveView("recipes");
  }

  function downloadSettings() {
    const file = new Blob([serializeInventory(exportInventory())], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = `capsule-shelf-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function uploadSettings(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    const input = event.currentTarget;
    try {
      const raw = await file.text();
      try {
        parseInventoryBackup(fullCatalog, raw);
      } catch {
        importInventory(raw);
        return;
      }
      if (window.confirm(t("replaceSettings"))) {
        importInventory(raw);
      }
    } catch {
      importInventory("не удалось прочитать файл");
    } finally {
      input.value = "";
    }
  }

  return (
    <main aria-busy={!ready} className="page-shell">
      <header className="page-header">
        <div className="brand-mark" aria-hidden="true"><svg viewBox="0 0 64 64"><path d="M47.9 15.3c8 7.2 7.2 21.3-1.7 32.4s-22.5 15-30.5 7.8S8.5 34.2 17.4 23.1s22.5-15 30.5-7.8Z" /><path className="brand-mark__crease" d="M18.9 49.6c8.2-2.7 14.8-8.2 19.5-16.1 4.5-7.5 5.7-14.2 3.7-20.1-1.6 1.5-3.1 3.2-4.5 5-3.2 4.3-5.1 9.2-7.8 13.9-2.8 4.8-6.6 9.1-11.2 12.5-1.1.8-2.3 1.6-3.6 2.3.9 1 2.2 1.9 3.9 2.5Z" /></svg></div>
        <div className="page-heading">
          <h1>{t("title")}</h1>
          <p className="page-intro">{t("subtitle")}</p>
        </div>
        <div className="line-chip"><span className="line-chip__dot" /> Nespresso Original</div>
        <label className="language-switch">
          <span>{t("language")}</span>
          <select aria-label={t("language")} onChange={(event) => setLocale(event.target.value as Locale)} value={locale}>
            <option value="en">English</option>
            <option value="ru">Русский</option>
            <option value="fr">Français</option>
          </select>
        </label>
      </header>

      <nav className="page-nav" aria-label={t("navAria")}>
        <button
          aria-current={activeView === "inventory" ? "page" : undefined}
          className={`page-nav__button${activeView === "inventory" ? " is-active" : ""}`}
          onClick={() => setActiveView("inventory")}
          type="button"
        >{t("inventoryTab")}</button>
        <button
          aria-current={activeView === "recipes" ? "page" : undefined}
          className={`page-nav__button${activeView === "recipes" ? " is-active" : ""}`}
          onClick={() => setActiveView("recipes")}
          type="button"
        >{t("recipesTab")}</button>
      </nav>

      {ready && storageNotice && <p className="storage-notice" role="status">{translateStorageNotice(storageNotice, t)}</p>}

      {!ready ? (
        <p className="inventory-loading" role="status">{t("loading")}</p>
      ) : activeView === "recipes" ? (
        <RecipesPage onTargetHandled={() => setPendingRecipeId(null)} targetRecipeId={pendingRecipeId} />
      ) : (
        <>
          <InventorySummary
            catalog={localizedCatalog}
            inventory={inventory}
            lowStockIds={lowStockIds}
            totalCapsules={totalCapsules}
            varietyCount={fullCatalog.length}
          />

          <section className="catalog-section" aria-labelledby="catalog-title">
        <div className="catalog-heading-row">
          <div>
            <h2 id="catalog-title">{t("catalogTitle")} <span>{fullCatalog.length}</span></h2>
          </div>
          <p className="catalog-hint">{t("catalogHint")}</p>
        </div>
        <InventoryFilters category={categoryFilter} onCategoryChange={setCategoryFilter} onChange={setFilter} value={filter} />
        <CapsuleGrid
          catalog={localizedCapsules}
          inventory={inventory}
          lowStockIds={lowStockIds}
          onFavoriteToggle={toggleFavorite}
          onNoteSave={saveNote}
          onQuantitySet={changeQuantity}
          onRecipeSelect={openRecipe}
          onThresholdChange={updateThreshold}
        />
          </section>
        </>
      )}

      <footer className="page-footer">
        <div className="page-footer__storage">
          <span>{t("browserStorage")}</span>
          <div className="settings-actions">
            <button className="settings-action" disabled={!ready} onClick={downloadSettings} type="button">{t("downloadSettings")}</button>
            <button className="settings-action" disabled={!ready} onClick={() => settingsFileInput.current?.click()} type="button">{t("uploadFile")}</button>
            <input
              accept=".json,application/json"
              aria-label={t("fileInput")}
              className="visually-hidden"
              onChange={uploadSettings}
              ref={settingsFileInput}
              type="file"
            />
          </div>
        </div>
        <a className="page-footer__catalog" href="https://www.nespresso.com/ca/en/order/capsules/original" rel="noreferrer" target="_blank">{t("catalogLink")}</a>
      </footer>
    </main>
  );
}

function translateStorageNotice(notice: string, t: (key: MessageKey) => string): string {
  const noticeKeys: Record<string, MessageKey> = {
    "Браузерное хранилище недоступно. Изменения могут не сохраниться после закрытия страницы.": "storageNoticeUnavailable",
    "Не удалось прочитать настройки браузера. Загрузи резервную копию или скачай текущие данные перед продолжением.": "storageNoticeRead",
    "Настройки перенесены из старого браузерного хранилища.": "storageNoticeMigrated",
    "Не удалось сохранить данные в браузере. Попробуй скачать резервную копию.": "storageNoticeSave",
    "Не удалось сохранить данные в браузере. Скачай резервную копию и освободи место в хранилище.": "storageNoticeSaveFull",
    "Настройки загружены в этот браузер.": "storageNoticeLoaded",
    "Файл не является корректным JSON.": "invalidJson",
    "Формат файла настроек не распознан.": "invalidBackup",
    "Не удалось загрузить файл настроек.": "storageNoticeImport",
  };
  const key = noticeKeys[notice];
  return key ? t(key) : notice;
}
