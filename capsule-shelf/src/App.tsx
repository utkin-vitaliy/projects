import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { CapsuleGrid } from "./components/CapsuleGrid";
import { InventoryFilters } from "./components/InventoryFilters";
import { InventorySummary } from "./components/InventorySummary";
import { capsules as originalCatalog } from "./data/capsules";
import { vertuoCapsules, vertuoCatalogUrl } from "./data/vertuoCapsules";
import { useInventory } from "./features/inventory/useInventory";
import { serializeInventory } from "./storage/inventoryStorage";
import { localizeCapsule } from "./i18n/capsuleContent";
import { LocaleProvider, useLocale, type Locale, type MessageKey } from "./i18n/locale";
import { recipeIds } from "./data/recipeIndex";
import { DEFAULT_INVENTORY_FILTERS, DEFAULT_RECIPE_FILTERS, parseUserSettings, serializeUserSettings, type CoffeeSystem, type InventoryFilter, type InventoryFilterPreferences, type RecipeEdits, type RecipeFilter, type RecipeFilterPreferences, type RecipeTextOverride, type UserSettings } from "./storage/userSettings";
import { settingsStorageKey, type SettingsNamespace } from "./storage/settingsStorage";
import { getGoogleAccount, readDriveSettings, requestGoogleAccessToken, writeDriveSettings, type DriveSettingsFile, type GoogleAccount } from "./storage/googleDrive";
import { GoogleDriveControl, type GoogleDriveControlState } from "./components/GoogleDriveControl";
import { clearRememberedGoogleAccount, readRememberedGoogleAccount, rememberGoogleAccount, type RememberedGoogleAccount } from "./storage/rememberedGoogleAccount";

const RecipesPage = lazy(() => import("./components/RecipesPage").then(({ RecipesPage: Component }) => ({ default: Component })));

type ConnectedGoogleAccount = GoogleAccount & { accessToken: string; fileId: string };
const USER_SETTINGS_STORAGE_KEY = "capsule-shelf:user-settings:v1";
const allCapsules = [...originalCatalog, ...vertuoCapsules];

const feedbackFormUrls: Record<Locale, string> = {
  en: "https://github.com/utkin-vitaliy/projects/issues/new?template=feedback-en.yml",
  ru: "https://github.com/utkin-vitaliy/projects/issues/new?template=feedback-ru.yml",
  fr: "https://github.com/utkin-vitaliy/projects/issues/new?template=feedback-fr.yml",
};

export default function App() {
  const [account, setAccount] = useState<ConnectedGoogleAccount | null>(null);
  const [rememberedAccount, setRememberedAccount] = useState<RememberedGoogleAccount | null>(readRememberedGoogleAccount);
  const activeAccount = account ?? rememberedAccount;
  const namespace: SettingsNamespace = activeAccount ? { provider: "google", subject: activeAccount.sub } : null;
  function changeAccount(next: ConnectedGoogleAccount | null) {
    setAccount(next);
    if (next) {
      const remembered = { sub: next.sub, email: next.email };
      rememberGoogleAccount(remembered);
      setRememberedAccount(remembered);
    }
  }
  function forgetAccount() {
    clearRememberedGoogleAccount();
    setRememberedAccount(null);
    setAccount(null);
  }
  return <LocaleProvider storageNamespace={namespace}><CapsuleShelfApp account={account} rememberedAccount={rememberedAccount} namespace={namespace} onAccountChange={changeAccount} onDisconnect={forgetAccount} /></LocaleProvider>;
}

function CapsuleShelfApp({ account, rememberedAccount, namespace, onAccountChange, onDisconnect }: { account: ConnectedGoogleAccount | null; rememberedAccount: RememberedGoogleAccount | null; namespace: SettingsNamespace; onAccountChange: (account: ConnectedGoogleAccount | null) => void; onDisconnect: () => void }) {
  const { locale, setLocale, t } = useLocale();
  const initialHash = window.location.hash;
  const [activeView, setActiveView] = useState<"inventory" | "recipes">(initialHash === "#recipes" ? "recipes" : "inventory");
  const shouldScrollToView = useRef(initialHash === "#recipes" || initialHash === "#capsules");
  const [pendingRecipeId, setPendingRecipeId] = useState<string | null>(null);
  const [pendingCapsuleFocusId, setPendingCapsuleFocusId] = useState<string | null>(null);
  const [capsuleSearch, setCapsuleSearch] = useState("");
  const [favoriteRecipeIds, setFavoriteRecipeIds] = useState<string[]>([]);
  const [recipeEdits, setRecipeEdits] = useState<RecipeEdits>({});
  const [coffeeSystem, setCoffeeSystem] = useState<CoffeeSystem>("original");
  const [filterPreferences, setFilterPreferences] = useState<InventoryFilterPreferences>({ ...DEFAULT_INVENTORY_FILTERS });
  const [recipeFilterPreferences, setRecipeFilterPreferences] = useState<RecipeFilterPreferences>({ ...DEFAULT_RECIPE_FILTERS });
  const filterPreferencesRef = useRef(filterPreferences);
  filterPreferencesRef.current = filterPreferences;
  const [loadedSettingsKey, setLoadedSettingsKey] = useState("");
  const [syncState, setSyncState] = useState<"idle" | "connecting" | "saving" | "saved" | "error">("idle");
  const [syncError, setSyncError] = useState("");
  const [pendingConnection, setPendingConnection] = useState<{ account: GoogleAccount; accessToken: string; driveFile: DriveSettingsFile; localSettings: UserSettings; cloudSettings: UserSettings } | null>(null);
  const settingsFileInput = useRef<HTMLInputElement>(null);
  const settingsMenuRef = useRef<HTMLDetailsElement>(null);
  const selectedCatalog = coffeeSystem === "original" ? originalCatalog : vertuoCapsules;
  const lastSyncedJson = useRef("");
  const driveWriteQueue = useRef<Promise<void>>(Promise.resolve());
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
    readyForNamespace,
    exportInventory,
    importInventory,
    changeQuantity,
    toggleFavorite,
    updateThreshold,
    saveNote,
  } = useInventory(namespace, allCapsules, selectedCatalog);

  const recipeFavoritesStorageKey = settingsStorageKey("capsule-shelf:recipe-favorites:v1", namespace);
  const completeSettingsStorageKey = settingsStorageKey(USER_SETTINGS_STORAGE_KEY, namespace);
  const settingsReady = ready && loadedSettingsKey === completeSettingsStorageKey;
  const completeSettings = useMemo<UserSettings>(() => ({
    format: "capsule-shelf-user-settings",
    version: 1,
    updatedAt: new Date().toISOString(),
    locale,
    system: coffeeSystem,
    filters: filterPreferences,
    recipeFilters: recipeFilterPreferences,
    inventory: exportInventory(),
    favoriteRecipes: favoriteRecipeIds,
    recipeEdits,
  }), [locale, coffeeSystem, filterPreferences, recipeFilterPreferences, inventory, favoriteRecipeIds, recipeEdits]);
  const settingsJson = useMemo(() => serializeUserSettings(completeSettings), [completeSettings]);

  useEffect(() => {
    if (!readyForNamespace) return;
    let nextSystem: CoffeeSystem = "original";
    let nextFilters: InventoryFilterPreferences = { ...DEFAULT_INVENTORY_FILTERS };
    let nextRecipeFilters: RecipeFilterPreferences = { ...DEFAULT_RECIPE_FILTERS };
    let nextFavoriteRecipes: string[] = [];
    let nextRecipeEdits: RecipeEdits = {};
    try {
      const raw = window.localStorage.getItem(completeSettingsStorageKey);
      if (raw) {
        const settings = parseUserSettings(raw, allCapsules, recipeIds, "en");
        nextSystem = settings.system;
        nextFilters = settings.filters;
        nextRecipeFilters = settings.recipeFilters;
        nextFavoriteRecipes = settings.favoriteRecipes;
        nextRecipeEdits = settings.recipeEdits ?? {};
      }
    } catch {
      // Missing or older settings safely select Original.
    }
    try {
      const storedFavorites: unknown = JSON.parse(window.localStorage.getItem(recipeFavoritesStorageKey) ?? "null");
      if (Array.isArray(storedFavorites)) nextFavoriteRecipes = storedFavorites.filter((id): id is string => typeof id === "string");
    } catch {
      // Fall back to the favorites from the full settings file.
    }
    setCoffeeSystem(nextSystem);
    setFilterPreferences(nextFilters);
    setRecipeFilterPreferences(nextRecipeFilters);
    setFavoriteRecipeIds(nextFavoriteRecipes);
    setRecipeEdits(nextRecipeEdits);
    setFilter(nextFilters[nextSystem]);
    setLoadedSettingsKey(completeSettingsStorageKey);
  }, [readyForNamespace, completeSettingsStorageKey, recipeFavoritesStorageKey, setFilter]);

  useEffect(() => {
    if (!readyForNamespace || loadedSettingsKey !== completeSettingsStorageKey) return;
    try {
      window.localStorage.setItem(recipeFavoritesStorageKey, JSON.stringify(favoriteRecipeIds));
      window.localStorage.setItem(settingsStorageKey(USER_SETTINGS_STORAGE_KEY, namespace), settingsJson);
    } catch { /* Keep the in-memory copy available if browser storage is blocked. */ }
  }, [favoriteRecipeIds, readyForNamespace, recipeFavoritesStorageKey, settingsJson, namespace, loadedSettingsKey, completeSettingsStorageKey]);

  useEffect(() => {
    if (!account || !readyForNamespace || loadedSettingsKey !== completeSettingsStorageKey) return;
    const payload = parseUserSettings(settingsJson, allCapsules, recipeIds, locale);
    const comparable = comparableSettings(payload);
    if (comparable === lastSyncedJson.current) return;
    setSyncState("saving");
    const timeout = window.setTimeout(() => {
      const save = driveWriteQueue.current
        .catch(() => undefined)
        .then(() => writeDriveSettings(account.accessToken, settingsJson, account.fileId));
      driveWriteQueue.current = save.then(() => undefined, () => undefined);
      void save
        .then(() => {
          lastSyncedJson.current = comparable;
          setSyncState("saved");
          setSyncError("");
        })
        .catch((error: unknown) => {
          setSyncState("error");
          setSyncError(error instanceof Error ? error.message : syncCopy(locale).saveError);
        });
    }, 900);
    return () => window.clearTimeout(timeout);
  }, [account, readyForNamespace, settingsJson, locale, coffeeSystem, loadedSettingsKey, completeSettingsStorageKey]);
  const localizedCatalog = useMemo(() => selectedCatalog.map((capsule) => localizeCapsule(capsule, locale)), [locale, selectedCatalog]);
  const localizedCapsules = useMemo(() => {
    const query = normalizeSearch(capsuleSearch);
    return capsules
      .map((capsule) => localizeCapsule(capsule, locale))
      .filter((capsule) => !query || (["en", "ru", "fr"] as const).some((searchLocale) => {
        const translatedCapsule = localizeCapsule(capsule, searchLocale);
        return normalizeSearch(translatedCapsule.name).includes(query)
          || normalizeSearch(translatedCapsule.flavor).includes(query);
      }));
  }, [capsules, locale, capsuleSearch]);

  useEffect(() => {
    setFilter(filterPreferencesRef.current[coffeeSystem] ?? "all");
    setCategoryFilter("all");
    setCapsuleSearch("");
  }, [coffeeSystem, setFilter, setCategoryFilter]);

  function selectInventoryFilter(nextFilter: InventoryFilter) {
    setFilterPreferences((current) => ({ ...current, [coffeeSystem]: nextFilter }));
    setFilter(nextFilter);
  }

  function selectRecipeFilter(nextFilter: RecipeFilter) {
    setRecipeFilterPreferences((current) => ({ ...current, [coffeeSystem]: nextFilter }));
  }

  function saveRecipeEdit(recipeId: string, editLocale: Locale, edit: RecipeTextOverride) {
    setRecipeEdits((current) => ({
      ...current,
      [recipeId]: { ...current[recipeId], [editLocale]: edit },
    }));
  }

  function resetRecipeEdit(recipeId: string, editLocale: Locale) {
    setRecipeEdits((current) => {
      const locales = { ...current[recipeId] };
      delete locales[editLocale];
      if (!Object.keys(locales).length) {
        const next = { ...current };
        delete next[recipeId];
        return next;
      }
      return { ...current, [recipeId]: locales };
    });
  }

  useEffect(() => {
    if (window.location.hash !== "#capsules" && window.location.hash !== "#recipes") {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#capsules`);
    }
    const syncViewFromHash = () => {
      const hash = window.location.hash;
      if (hash !== "#capsules" && hash !== "#recipes") return;
      shouldScrollToView.current = true;
      setActiveView(hash === "#recipes" ? "recipes" : "inventory");
    };
    window.addEventListener("hashchange", syncViewFromHash);
    window.addEventListener("popstate", syncViewFromHash);
    return () => {
      window.removeEventListener("hashchange", syncViewFromHash);
      window.removeEventListener("popstate", syncViewFromHash);
    };
  }, []);

  useEffect(() => {
    if (!shouldScrollToView.current) return;
    shouldScrollToView.current = false;
    const targetRecipeId = activeView === "recipes" ? pendingRecipeId : null;
    if (targetRecipeId) return;
    window.requestAnimationFrame(() => {
      document.getElementById(activeView === "recipes" ? "recipes" : "capsules")?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    });
  }, [activeView, pendingRecipeId]);

  useEffect(() => {
    if (!pendingCapsuleFocusId || !settingsReady || activeView !== "inventory" || filter !== "favorites") return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(`capsule-${pendingCapsuleFocusId}`)?.scrollIntoView?.({ behavior: "smooth", block: "center" });
      setPendingCapsuleFocusId(null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeView, filter, pendingCapsuleFocusId, settingsReady]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !settingsMenuRef.current?.contains(event.target)) {
        if (settingsMenuRef.current) settingsMenuRef.current.open = false;
      }
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, []);

  function openRecipe(recipeId: string) {
    setPendingRecipeId(recipeId);
    navigateToView("recipes");
  }

  function openFavoriteCapsule(capsuleId: string) {
    setCapsuleSearch("");
    setCategoryFilter("all");
    selectInventoryFilter("favorites");
    setPendingCapsuleFocusId(capsuleId);
    navigateToView("inventory");
  }

  function navigateToView(view: "inventory" | "recipes") {
    const isCurrentView = view === activeView;
    shouldScrollToView.current = true;
    setActiveView(view);
    const hash = view === "recipes" ? "#recipes" : "#capsules";
    if (window.location.hash !== hash) window.history.pushState(null, "", hash);
    if (isCurrentView) {
      window.requestAnimationFrame(() => document.getElementById(view === "recipes" ? "recipes" : "capsules")?.scrollIntoView?.({ behavior: "smooth", block: "start" }));
      shouldScrollToView.current = false;
    }
  }

  function downloadSettings() {
    const file = new Blob([settingsJson], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = `capsule-shelf-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function closeSettingsMenu() {
    if (settingsMenuRef.current) settingsMenuRef.current.open = false;
  }

  function chooseSettingsFile() {
    closeSettingsMenu();
    settingsFileInput.current?.click();
  }

  async function uploadSettings(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const raw = await file.text();
      let imported: UserSettings;
      try {
        const parsedFormat = (JSON.parse(raw) as { format?: unknown }).format;
        const parsedSettings = parseUserSettings(raw, allCapsules, recipeIds, locale);
        imported = parsedFormat === "capsule-shelf-user-settings"
          ? parsedSettings
          : { ...completeSettings, inventory: parsedSettings.inventory, updatedAt: new Date().toISOString() };
      } catch {
        importInventory(raw);
        return;
      }

      if (!window.confirm(t("replaceSettings"))) return;
      persistSettingsForNamespace(imported, namespace);
      importInventory(serializeInventory(imported.inventory));
      setFavoriteRecipeIds(imported.favoriteRecipes);
      setRecipeEdits(imported.recipeEdits ?? {});
      setRecipeFilterPreferences(imported.recipeFilters);
      setLocale(imported.locale);
      setFilterPreferences(imported.filters);
      setCoffeeSystem(imported.system);
      setFilter(imported.filters[imported.system]);
    } catch {
      importInventory("не удалось прочитать файл");
    } finally {
      input.value = "";
    }
  }

  async function connectGoogle() {
    setSyncState("connecting");
    setSyncError("");
    try {
      const accessToken = await requestGoogleAccessToken(import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "");
      const googleAccount = await getGoogleAccount(accessToken);
      const driveFile = await readDriveSettings(accessToken);
      const accountNamespace: SettingsNamespace = { provider: "google", subject: googleAccount.sub };
      const localRaw = window.localStorage.getItem(settingsStorageKey(USER_SETTINGS_STORAGE_KEY, accountNamespace));
      const localSettings = localRaw
        ? parseUserSettings(localRaw, allCapsules, recipeIds, locale)
        : parseUserSettings(settingsJson, allCapsules, recipeIds, locale);
      if (!driveFile) {
        const saved = await writeDriveSettings(accessToken, serializeUserSettings(localSettings));
        persistSettingsForNamespace(localSettings, accountNamespace);
        setFavoriteRecipeIds(localSettings.favoriteRecipes);
        setRecipeEdits(localSettings.recipeEdits ?? {});
        setRecipeFilterPreferences(localSettings.recipeFilters);
        setLocale(localSettings.locale);
        setFilterPreferences(localSettings.filters);
        setCoffeeSystem(localSettings.system);
        setFilter(localSettings.filters[localSettings.system]);
        lastSyncedJson.current = comparableSettings(localSettings);
        onAccountChange({ ...googleAccount, accessToken, fileId: saved.fileId });
        setSyncState("saved");
        return;
      }
      const cloudSettings = parseUserSettings(driveFile.raw, allCapsules, recipeIds, locale);
      if (comparableSettings(localSettings) !== comparableSettings(cloudSettings)) {
        setPendingConnection({ account: googleAccount, accessToken, driveFile, localSettings, cloudSettings });
        setSyncState("idle");
        return;
      }
      persistSettingsForNamespace(cloudSettings, accountNamespace);
      setFavoriteRecipeIds(cloudSettings.favoriteRecipes);
      setRecipeEdits(cloudSettings.recipeEdits ?? {});
      setRecipeFilterPreferences(cloudSettings.recipeFilters);
      setLocale(cloudSettings.locale);
      setFilterPreferences(cloudSettings.filters);
      setCoffeeSystem(cloudSettings.system);
      setFilter(cloudSettings.filters[cloudSettings.system]);
      lastSyncedJson.current = comparableSettings(cloudSettings);
      onAccountChange({ ...googleAccount, accessToken, fileId: driveFile.fileId });
      setSyncState("saved");
    } catch (error) {
      setSyncState("error");
      setSyncError(error instanceof Error ? error.message : syncCopy(locale).connectionError);
    }
  }

  async function resolveConnection(useCloud: boolean) {
    if (!pendingConnection) return;
    const selected = useCloud ? pendingConnection.cloudSettings : pendingConnection.localSettings;
    const accountNamespace: SettingsNamespace = { provider: "google", subject: pendingConnection.account.sub };
    persistSettingsForNamespace(selected, accountNamespace);
    // Update inventory state immediately; changing the account namespace alone can
    // leave the currently mounted inventory hook showing the previous browser data.
    importInventory(serializeInventory(selected.inventory), accountNamespace);
    setFavoriteRecipeIds(selected.favoriteRecipes);
    setRecipeEdits(selected.recipeEdits ?? {});
    setRecipeFilterPreferences(selected.recipeFilters);
    setLocale(selected.locale);
    setFilterPreferences(selected.filters);
    setCoffeeSystem(selected.system);
    setFilter(selected.filters[selected.system]);
    setPendingConnection(null);
    if (useCloud) {
      lastSyncedJson.current = comparableSettings(selected);
      onAccountChange({ ...pendingConnection.account, accessToken: pendingConnection.accessToken, fileId: pendingConnection.driveFile.fileId });
      setSyncState("saved");
      return;
    }

    setSyncState("saving");
    try {
      const saved = await writeDriveSettings(pendingConnection.accessToken, serializeUserSettings(selected), pendingConnection.driveFile.fileId);
      lastSyncedJson.current = comparableSettings(selected);
      onAccountChange({ ...pendingConnection.account, accessToken: pendingConnection.accessToken, fileId: saved.fileId });
      setSyncState("saved");
      setSyncError("");
    } catch (error) {
      setSyncState("error");
      setSyncError(error instanceof Error ? error.message : syncCopy(locale).saveError);
    }
  }

  function disconnectGoogle() {
    onDisconnect();
    setSyncState("idle");
    setSyncError("");
    setPendingConnection(null);
    lastSyncedJson.current = "";
  }

  const driveControlState = getDriveControlState(account, rememberedAccount, syncState);
  const driveControlLabels = syncCopy(locale);
  if (syncError) driveControlLabels.error = `${driveControlLabels.error}: ${syncError}`;

  return (
      <main aria-busy={!settingsReady} className="page-shell">
      <header className="page-header">
        <div className="brand-mark" aria-hidden="true"><svg viewBox="0 0 64 64"><g transform="translate(0 -3)"><path d="M47.9 15.3c8 7.2 7.2 21.3-1.7 32.4s-22.5 15-30.5 7.8S8.5 34.2 17.4 23.1s22.5-15 30.5-7.8Z"/><path className="brand-mark__crease" d="M18.9 49.6c8.2-2.7 14.8-8.2 19.5-16.1 4.5-7.5 5.7-14.2 3.7-20.1-1.6 1.5-3.1 3.2-4.5 5-3.2 4.3-5.1 9.2-7.8 13.9-2.8 4.8-6.6 9.1-11.2 12.5-1.1.8-2.3 1.6-3.6 2.3.9 1 2.2 1.9 3.9 2.5Z"/></g></svg></div>
        <div className="page-heading">
          <h1>{t("title")}</h1>
          <p className="page-intro">{t("subtitle")}</p>
        </div>
        <div aria-label={t("systemSelector")} className="system-switch" role="group">
          {([ ["original", "originalSystem"], ["vertuo", "vertuoSystem"] ] as const).map(([system, label]) => (
            <button
              aria-pressed={coffeeSystem === system}
              className={`system-switch__button${coffeeSystem === system ? " is-active" : ""}`}
              key={system}
              onClick={() => setCoffeeSystem(system)}
              type="button"
            >{t(label)}</button>
          ))}
        </div>
        <div className="header-tools">
        <GoogleDriveControl
          disabled={!ready || syncState === "connecting" || syncState === "saving"}
          email={account?.email ?? rememberedAccount?.email ?? null}
          labels={driveControlLabels}
          onConnect={() => { void connectGoogle(); }}
          onDisconnect={disconnectGoogle}
          state={driveControlState}
        />
        <div aria-label={t("language")} className="language-switch" role="group">
          {([
            ["en", "EN", "englishName"],
            ["fr", "FR", "frenchName"],
            ["ru", "RU", "russianName"],
          ] as const).map(([code, shortLabel, nameKey]) => (
            <button
              aria-label={t(nameKey)}
              aria-pressed={locale === code}
              className={`language-switch__button${locale === code ? " is-active" : ""}`}
              key={code}
              onClick={() => setLocale(code as Locale)}
              type="button"
            >{shortLabel}</button>
          ))}
        </div>
        </div>
      </header>

      <nav className="page-nav" aria-label={t("navAria")}>
        <button
          aria-current={activeView === "inventory" ? "page" : undefined}
          className={`page-nav__button${activeView === "inventory" ? " is-active" : ""}`}
          onClick={() => navigateToView("inventory")}
          type="button"
        >{t("inventoryTab")}</button>
        <button
          aria-current={activeView === "recipes" ? "page" : undefined}
          className={`page-nav__button${activeView === "recipes" ? " is-active" : ""}`}
          onClick={() => navigateToView("recipes")}
          type="button"
        >{t("recipesTab")}</button>
      </nav>

      {settingsReady && storageNotice && <p className="storage-notice" role="status">{translateStorageNotice(storageNotice, t)}</p>}

      {!settingsReady ? (
        <p className="inventory-loading" role="status">{t("loading")}</p>
      ) : activeView === "recipes" ? (
        <Suspense fallback={<p className="inventory-loading" role="status">{t("loading")}</p>}><RecipesPage system={coffeeSystem} activeFilter={recipeFilterPreferences[coffeeSystem]} onFilterChange={selectRecipeFilter} favoriteIds={favoriteRecipeIds} onFavoriteIdsChange={setFavoriteRecipeIds} recipeEdits={recipeEdits} onRecipeEdit={saveRecipeEdit} onRecipeReset={resetRecipeEdit} initialFocusRecipeId={pendingRecipeId} onFocusRecipeChange={setPendingRecipeId} /></Suspense>
      ) : (
        <div id="capsules" className="capsules-view">
          <InventorySummary
            catalog={localizedCatalog}
            inventory={inventory}
            lowStockIds={lowStockIds}
            totalCapsules={totalCapsules}
            varietyCount={selectedCatalog.length}
            onSelectCapsule={openFavoriteCapsule}
          />

          <section className="catalog-section" aria-labelledby="catalog-title">
        <div className="catalog-heading-row">
          <div>
            <h2 id="catalog-title">{t("catalogTitle")} <span>{selectedCatalog.length}</span></h2>
          </div>
          <p className="catalog-hint">{t("catalogHint")}</p>
        </div>
        <InventoryFilters catalog={selectedCatalog} category={categoryFilter} favoriteCount={selectedCatalog.filter(({ id }) => inventory[id]?.favorite).length} onCategoryChange={setCategoryFilter} onChange={selectInventoryFilter} onSearchChange={setCapsuleSearch} search={capsuleSearch} value={filter} />
        <CapsuleGrid
          catalog={localizedCapsules}
          inventory={inventory}
          lowStockIds={lowStockIds}
          onFavoriteToggle={toggleFavorite}
          onNoteSave={saveNote}
          onQuantitySet={changeQuantity}
          onRecipeSelect={openRecipe}
          onThresholdChange={updateThreshold}
          searchActive={capsuleSearch.trim().length > 0}
        />
          </section>
        </div>
      )}

      <footer className="page-footer">
        <div className="page-footer__storage">
          <a className="page-footer__catalog" href={coffeeSystem === "vertuo" ? vertuoCatalogUrl : "https://www.nespresso.com/ca/en/order/capsules/original"} rel="noreferrer" target="_blank">{t("catalogLink")}</a>
          <a className="page-footer__privacy" href={`${import.meta.env.BASE_URL}privacy.html`}>{t("privacyPolicyLink")}</a>
        </div>
        <div className="page-footer__right">
          <div className="page-footer__actions">
            <details
              className="settings-dropdown"
              onKeyDown={(event) => {
                if (event.key !== "Escape") return;
                event.preventDefault();
                closeSettingsMenu();
                settingsMenuRef.current?.querySelector("summary")?.focus();
              }}
              ref={settingsMenuRef}
            >
              <summary aria-haspopup="true" className="settings-action settings-dropdown__trigger" role="button">
                {t("settingsMenu")}
                <svg aria-hidden="true" className="settings-dropdown__chevron" fill="none" viewBox="0 0 16 16"><path d="m4 6 4 4 4-4" /></svg>
              </summary>
              <div aria-label={t("settingsMenu")} className="settings-dropdown__menu" role="group">
                <button className="settings-dropdown__item" disabled={!settingsReady} onClick={() => { closeSettingsMenu(); downloadSettings(); }} type="button">{t("downloadSettings")}</button>
                <button className="settings-dropdown__item" disabled={!settingsReady} onClick={chooseSettingsFile} type="button">{t("uploadFile")}</button>
              </div>
            </details>
            <input accept=".json,application/json" aria-label={t("fileInput")} className="visually-hidden" onChange={uploadSettings} ref={settingsFileInput} type="file" />
            <a className="settings-action page-footer__feedback-link" href={feedbackFormUrls[locale]} rel="noreferrer" target="_blank">{t("feedbackLink")}</a>
          </div>
          <span className="page-footer__feedback-note">{t("feedbackPrivacy")}</span>
        </div>
      </footer>
      {pendingConnection && (
        <div className="sync-dialog-backdrop" role="presentation">
          <section aria-labelledby="sync-dialog-title" aria-modal="true" className="sync-dialog" role="dialog">
            <h2 id="sync-dialog-title">{syncCopy(locale).chooseTitle}</h2>
            <p>{syncCopy(locale).chooseDescription}</p>
            <p><strong>{pendingConnection.account.email}</strong></p>
            <div className="sync-dialog__actions">
              <button className="sync-dialog__choice" onClick={() => { void resolveConnection(false); }} type="button">
                <span>{syncCopy(locale).useDrive}</span>
                <span className="sync-dialog__choice-helper">{syncCopy(locale).useDriveDescription}</span>
              </button>
              <button className="sync-dialog__choice" onClick={() => { void resolveConnection(true); }} type="button">
                <span>{syncCopy(locale).useDevice}</span>
                <span className="sync-dialog__choice-helper">{syncCopy(locale).useDeviceDescription}</span>
              </button>
              <button className="settings-action sync-dialog__cancel" onClick={() => setPendingConnection(null)} type="button">{syncCopy(locale).cancel}</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase();
}

function persistSettingsForNamespace(settings: UserSettings, namespace: SettingsNamespace) {
  const inventoryKey = settingsStorageKey("capsule-shelf:inventory:v2", namespace);
  const favoritesKey = settingsStorageKey("capsule-shelf:recipe-favorites:v1", namespace);
  const localeKey = settingsStorageKey("capsule-shelf:locale:v1", namespace);
  window.localStorage.setItem(inventoryKey, serializeInventory(settings.inventory));
  window.localStorage.setItem(favoritesKey, JSON.stringify(settings.favoriteRecipes));
  window.localStorage.setItem(localeKey, settings.locale);
  window.localStorage.setItem(settingsStorageKey(USER_SETTINGS_STORAGE_KEY, namespace), serializeUserSettings(settings));
}

function comparableSettings(settings: UserSettings): string {
  return JSON.stringify({
    locale: settings.locale,
    system: settings.system,
    filters: settings.filters,
    recipeFilters: settings.recipeFilters,
    inventory: Object.fromEntries(Object.entries(settings.inventory).sort(([a], [b]) => a.localeCompare(b))),
    favoriteRecipes: [...settings.favoriteRecipes].sort(),
    recipeEdits: settings.recipeEdits ?? {},
  });
}

function getDriveControlState(account: ConnectedGoogleAccount | null, rememberedAccount: RememberedGoogleAccount | null, state: "idle" | "connecting" | "saving" | "saved" | "error"): GoogleDriveControlState {
  if (state === "connecting") return "connecting";
  if (state === "saving") return "saving";
  if (state === "error") return "error";
  if (account) return "connected";
  if (rememberedAccount) return "remembered";
  return "disconnected";
}

function syncCopy(locale: Locale) {
  const copies = {
    en: { connect: "Connect Google Drive", reconnect: "Reconnect Google Drive", connecting: "Connecting to Google Drive…", saving: "Saving settings to Google Drive", connected: "Google Drive connected", remembered: "Google Drive remembered; click to resume sync", error: "Google Drive sync failed; click to reconnect", connectionError: "Could not connect to Google Drive.", saveError: "Google Drive sync failed.", popover: "Google Drive status", syncDescription: "Changes are saved in this browser right away and synced to Google Drive automatically after a short pause. After reloading the page, click this icon to resume syncing.", disconnect: "Disconnect Google Drive", chooseTitle: "Settings copies differ", chooseDescription: "Choose a sync direction. The copy at the destination will be replaced.", useDrive: "Save this device’s settings to Google Drive", useDriveDescription: "Replaces the current Google Drive settings file.", useDevice: "Load Google Drive settings onto this device", useDeviceDescription: "Replaces the settings Capsule Shelf uses in this browser.", cancel: "Cancel" },
    ru: { connect: "Подключить Google Drive", reconnect: "Продолжить синхронизацию с Google Drive", connecting: "Подключаю Google Drive…", saving: "Сохраняю настройки в Google Drive", connected: "Google Drive подключён", remembered: "Google Drive запомнен; нажми, чтобы продолжить синхронизацию", error: "Не удалось синхронизировать с Google Drive; нажми, чтобы подключить снова", connectionError: "Не удалось подключиться к Google Drive.", saveError: "Синхронизация с Google Drive не удалась.", popover: "Состояние Google Drive", syncDescription: "Изменения сразу сохраняются в этом браузере и автоматически отправляются в Google Drive после короткой паузы. После перезагрузки нажми на этот значок, чтобы возобновить синхронизацию.", disconnect: "Отключить Google Drive", chooseTitle: "Копии настроек различаются", chooseDescription: "Выберите направление синхронизации. Копия в месте назначения будет заменена.", useDrive: "Сохранить настройки этого устройства в Google Drive", useDriveDescription: "Заменит текущий файл настроек в Google Drive.", useDevice: "Загрузить настройки Google Drive на это устройство", useDeviceDescription: "Заменит настройки, которые Capsule Shelf использует в этом браузере.", cancel: "Отмена" },
    fr: { connect: "Connecter Google Drive", reconnect: "Reprendre la synchronisation avec Google Drive", connecting: "Connexion à Google Drive…", saving: "Enregistrement des paramètres dans Google Drive", connected: "Google Drive est connecté", remembered: "Google Drive est mémorisé; cliquez pour reprendre la synchronisation", error: "Échec de la synchronisation avec Google Drive; cliquez pour reconnecter", connectionError: "Impossible de se connecter à Google Drive.", saveError: "Échec de la synchronisation avec Google Drive.", popover: "État de Google Drive", syncDescription: "Les modifications sont enregistrées tout de suite dans ce navigateur, puis synchronisées automatiquement avec Google Drive après une courte pause. Après avoir rechargé la page, cliquez sur cette icône pour reprendre la synchronisation.", disconnect: "Déconnecter Google Drive", chooseTitle: "Les copies de réglages diffèrent", chooseDescription: "Choisissez le sens de synchronisation. La copie de destination sera remplacée.", useDrive: "Enregistrer les réglages de cet appareil dans Google Drive", useDriveDescription: "Remplace le fichier de réglages actuel dans Google Drive.", useDevice: "Charger les réglages de Google Drive sur cet appareil", useDeviceDescription: "Remplace les réglages utilisés par Capsule Shelf dans ce navigateur.", cancel: "Annuler" },
  };
  return copies[locale];
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
