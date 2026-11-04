import { useEffect, useMemo, useRef, useState } from "react";
import { CapsuleGrid } from "./components/CapsuleGrid";
import { InventoryFilters } from "./components/InventoryFilters";
import { InventorySummary } from "./components/InventorySummary";
import { RecipesPage } from "./components/RecipesPage";
import { capsules as fullCatalog } from "./data/capsules";
import { useInventory } from "./features/inventory/useInventory";
import { serializeInventory } from "./storage/inventoryStorage";
import { localizeCapsule } from "./i18n/catalogContent";
import { LocaleProvider, useLocale, type Locale, type MessageKey } from "./i18n/locale";
import { recipes } from "./data/recipes";
import { parseUserSettings, serializeUserSettings, type UserSettings } from "./storage/userSettings";
import { settingsStorageKey, type SettingsNamespace } from "./storage/settingsStorage";
import { getGoogleAccount, readDriveSettings, requestGoogleAccessToken, writeDriveSettings, type DriveSettingsFile, type GoogleAccount } from "./storage/googleDrive";
import { GoogleDriveControl, type GoogleDriveControlState } from "./components/GoogleDriveControl";
import { clearRememberedGoogleAccount, readRememberedGoogleAccount, rememberGoogleAccount, type RememberedGoogleAccount } from "./storage/rememberedGoogleAccount";

type ConnectedGoogleAccount = GoogleAccount & { accessToken: string; fileId: string };
const USER_SETTINGS_STORAGE_KEY = "capsule-shelf:user-settings:v1";

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
  const [capsuleSearch, setCapsuleSearch] = useState("");
  const [favoriteRecipeIds, setFavoriteRecipeIds] = useState<string[]>([]);
  const [syncState, setSyncState] = useState<"idle" | "connecting" | "saving" | "saved" | "error">("idle");
  const [syncError, setSyncError] = useState("");
  const [pendingConnection, setPendingConnection] = useState<{ account: GoogleAccount; accessToken: string; driveFile: DriveSettingsFile; localSettings: UserSettings; cloudSettings: UserSettings } | null>(null);
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
    changeQuantity,
    toggleFavorite,
    updateThreshold,
    saveNote,
  } = useInventory(namespace);

  const recipeFavoritesStorageKey = settingsStorageKey("capsule-shelf:recipe-favorites:v1", namespace);
  const completeSettings = useMemo<UserSettings>(() => ({
    format: "capsule-shelf-user-settings",
    version: 1,
    updatedAt: new Date().toISOString(),
    locale,
    inventory: exportInventory(),
    favoriteRecipes: favoriteRecipeIds,
  }), [locale, inventory, favoriteRecipeIds]);
  const settingsJson = useMemo(() => serializeUserSettings(completeSettings), [completeSettings]);

  useEffect(() => {
    try {
      const storedFavorites: unknown = JSON.parse(window.localStorage.getItem(recipeFavoritesStorageKey) ?? "[]");
      setFavoriteRecipeIds(Array.isArray(storedFavorites) ? storedFavorites.filter((id): id is string => typeof id === "string") : []);
    } catch {
      setFavoriteRecipeIds([]);
    }
  }, [recipeFavoritesStorageKey]);

  useEffect(() => {
    if (!readyForNamespace) return;
    try {
      window.localStorage.setItem(recipeFavoritesStorageKey, JSON.stringify(favoriteRecipeIds));
      window.localStorage.setItem(settingsStorageKey(USER_SETTINGS_STORAGE_KEY, namespace), settingsJson);
    } catch { /* Keep the in-memory copy available if browser storage is blocked. */ }
  }, [favoriteRecipeIds, readyForNamespace, recipeFavoritesStorageKey, settingsJson, namespace]);

  useEffect(() => {
    if (!account || !readyForNamespace) return;
    const payload = parseUserSettings(settingsJson, fullCatalog, recipes.map(({ id }) => id), locale);
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
          setSyncError(error instanceof Error ? error.message : "Google Drive sync failed.");
        });
    }, 900);
    return () => window.clearTimeout(timeout);
  }, [account, readyForNamespace, settingsJson, locale]);
  const localizedCatalog = useMemo(() => fullCatalog.map((capsule) => localizeCapsule(capsule, locale)), [locale]);
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
    window.requestAnimationFrame(() => {
      const target = document.getElementById(targetRecipeId ? `recipe-${targetRecipeId}` : activeView === "recipes" ? "recipes" : "capsules");
      if (targetRecipeId && target instanceof HTMLElement) {
        target.focus({ preventScroll: true });
        const navBottom = document.querySelector(".page-nav")?.getBoundingClientRect().bottom ?? 0;
        const visibleTop = Math.max(navBottom + 16, 16);
        const availableHeight = window.innerHeight - visibleTop - 24;
        const targetTop = visibleTop + Math.max(0, (availableHeight - target.getBoundingClientRect().height) / 2);
        const scrollTop = target.getBoundingClientRect().top + window.scrollY - targetTop;
        window.scrollTo(0, Math.max(0, scrollTop));
        setPendingRecipeId(null);
      } else {
        target?.scrollIntoView?.({ behavior: "smooth", block: "start" });
      }
    });
  }, [activeView, pendingRecipeId]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  function openRecipe(recipeId: string) {
    setPendingRecipeId(recipeId);
    navigateToView("recipes");
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
        ? parseUserSettings(localRaw, fullCatalog, recipes.map(({ id }) => id), locale)
        : parseUserSettings(settingsJson, fullCatalog, recipes.map(({ id }) => id), locale);
      if (!driveFile) {
        const saved = await writeDriveSettings(accessToken, serializeUserSettings(localSettings));
        persistSettingsForNamespace(localSettings, accountNamespace);
        setFavoriteRecipeIds(localSettings.favoriteRecipes);
        setLocale(localSettings.locale);
        lastSyncedJson.current = comparableSettings(localSettings);
        onAccountChange({ ...googleAccount, accessToken, fileId: saved.fileId });
        setSyncState("saved");
        return;
      }
      const cloudSettings = parseUserSettings(driveFile.raw, fullCatalog, recipes.map(({ id }) => id), locale);
      if (comparableSettings(localSettings) !== comparableSettings(cloudSettings)) {
        setPendingConnection({ account: googleAccount, accessToken, driveFile, localSettings, cloudSettings });
        setSyncState("idle");
        return;
      }
      persistSettingsForNamespace(cloudSettings, accountNamespace);
      setFavoriteRecipeIds(cloudSettings.favoriteRecipes);
      setLocale(cloudSettings.locale);
      lastSyncedJson.current = comparableSettings(cloudSettings);
      onAccountChange({ ...googleAccount, accessToken, fileId: driveFile.fileId });
      setSyncState("saved");
    } catch (error) {
      setSyncState("error");
      setSyncError(error instanceof Error ? error.message : "Could not connect Google Drive.");
    }
  }

  function resolveConnection(useCloud: boolean) {
    if (!pendingConnection) return;
    const selected = useCloud ? pendingConnection.cloudSettings : pendingConnection.localSettings;
    const accountNamespace: SettingsNamespace = { provider: "google", subject: pendingConnection.account.sub };
    persistSettingsForNamespace(selected, accountNamespace);
    setFavoriteRecipeIds(selected.favoriteRecipes);
    setLocale(selected.locale);
    lastSyncedJson.current = comparableSettings(selected);
    onAccountChange({ ...pendingConnection.account, accessToken: pendingConnection.accessToken, fileId: pendingConnection.driveFile.fileId });
    if (!useCloud) {
      setSyncState("saving");
      void writeDriveSettings(pendingConnection.accessToken, serializeUserSettings(selected), pendingConnection.driveFile.fileId)
        .then(() => setSyncState("saved"))
        .catch((error: unknown) => { setSyncState("error"); setSyncError(error instanceof Error ? error.message : "Google Drive sync failed."); });
    } else setSyncState("saved");
    setPendingConnection(null);
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
      <main aria-busy={!ready} className="page-shell">
      <header className="page-header">
        <div className="brand-mark" aria-hidden="true"><svg viewBox="0 0 64 64"><g transform="translate(0 -3)"><path d="M47.9 15.3c8 7.2 7.2 21.3-1.7 32.4s-22.5 15-30.5 7.8S8.5 34.2 17.4 23.1s22.5-15 30.5-7.8Z"/><path className="brand-mark__crease" d="M18.9 49.6c8.2-2.7 14.8-8.2 19.5-16.1 4.5-7.5 5.7-14.2 3.7-20.1-1.6 1.5-3.1 3.2-4.5 5-3.2 4.3-5.1 9.2-7.8 13.9-2.8 4.8-6.6 9.1-11.2 12.5-1.1.8-2.3 1.6-3.6 2.3.9 1 2.2 1.9 3.9 2.5Z"/></g></svg></div>
        <div className="page-heading">
          <h1>{t("title")}</h1>
          <p className="page-intro">{t("subtitle")}</p>
        </div>
        <div className="line-chip"><span className="line-chip__dot" /> Nespresso Original</div>
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
            ["ru", "RU", "russianName"],
            ["fr", "FR", "frenchName"],
            ["en", "EN", "englishName"],
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

      {ready && storageNotice && <p className="storage-notice" role="status">{translateStorageNotice(storageNotice, t)}</p>}

      {!ready ? (
        <p className="inventory-loading" role="status">{t("loading")}</p>
      ) : activeView === "recipes" ? (
        <RecipesPage favoriteIds={favoriteRecipeIds} onFavoriteIdsChange={setFavoriteRecipeIds} />
      ) : (
        <div id="capsules" className="capsules-view">
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
        <InventoryFilters category={categoryFilter} onCategoryChange={setCategoryFilter} onChange={setFilter} onSearchChange={setCapsuleSearch} search={capsuleSearch} value={filter} />
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
          <a className="page-footer__catalog" href="https://www.nespresso.com/ca/en/order/capsules/original" rel="noreferrer" target="_blank">{t("catalogLink")}</a>
          <a className="page-footer__privacy" href={`${import.meta.env.BASE_URL}privacy.html`}>{t("privacyPolicyLink")}</a>
        </div>
        <div className="page-footer__feedback">
          <a className="settings-action page-footer__feedback-link" href={feedbackFormUrls[locale]} rel="noreferrer" target="_blank">{t("feedbackLink")}</a>
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
              <button className="settings-action" onClick={() => resolveConnection(true)} type="button">{syncCopy(locale).useDrive}</button>
              <button className="settings-action" onClick={() => resolveConnection(false)} type="button">{syncCopy(locale).useDevice}</button>
              <button className="settings-action" onClick={() => setPendingConnection(null)} type="button">{syncCopy(locale).cancel}</button>
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
    inventory: Object.fromEntries(Object.entries(settings.inventory).sort(([a], [b]) => a.localeCompare(b))),
    favoriteRecipes: [...settings.favoriteRecipes].sort(),
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
    en: { connect: "Connect Google Drive", reconnect: "Reconnect Google Drive", connecting: "Connecting to Google Drive…", saving: "Saving settings to Google Drive", connected: "Google Drive connected", remembered: "Google Drive remembered; click to resume sync", error: "Google Drive sync failed; click to reconnect", popover: "Google Drive status", disconnect: "Disconnect Google Drive", chooseTitle: "Choose which settings to keep", chooseDescription: "This device and Google Drive have different settings. Your unselected copy will remain saved.", useDrive: "Use Google Drive", useDevice: "Use this device", cancel: "Cancel" },
    ru: { connect: "Подключить Google Drive", reconnect: "Продолжить синхронизацию с Google Drive", connecting: "Подключаю Google Drive…", saving: "Сохраняю настройки в Google Drive", connected: "Google Drive подключён", remembered: "Google Drive запомнен; нажми, чтобы продолжить синхронизацию", error: "Не удалось синхронизировать с Google Drive; нажми, чтобы подключить снова", popover: "Состояние Google Drive", disconnect: "Отключить Google Drive", chooseTitle: "Выбери, какие настройки оставить", chooseDescription: "На устройстве и в Google Drive разные настройки. Вторая копия останется сохранённой.", useDrive: "Использовать Google Drive", useDevice: "Использовать это устройство", cancel: "Отмена" },
    fr: { connect: "Connecter Google Drive", reconnect: "Reprendre la synchronisation avec Google Drive", connecting: "Connexion à Google Drive…", saving: "Enregistrement des paramètres dans Google Drive", connected: "Google Drive est connecté", remembered: "Google Drive est mémorisé; cliquez pour reprendre la synchronisation", error: "Échec de la synchronisation avec Google Drive; cliquez pour reconnecter", popover: "État de Google Drive", disconnect: "Déconnecter Google Drive", chooseTitle: "Choisissez les paramètres à conserver", chooseDescription: "Les paramètres de cet appareil et de Google Drive diffèrent. L’autre copie restera enregistrée.", useDrive: "Utiliser Google Drive", useDevice: "Utiliser cet appareil", cancel: "Annuler" },
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
