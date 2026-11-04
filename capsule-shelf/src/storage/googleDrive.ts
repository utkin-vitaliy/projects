export const GOOGLE_DRIVE_SCOPE = "openid email https://www.googleapis.com/auth/drive.appdata";
const GOOGLE_SCRIPT_URL = "https://accounts.google.com/gsi/client";
const SETTINGS_FILE_NAME = "capsule-shelf-settings.json";

type GoogleTokenResponse = { access_token?: string; error?: string; error_description?: string };
type GoogleTokenClient = { requestAccessToken: (options: { prompt: string }) => void };
type GoogleOAuthApi = { initTokenClient: (options: {
  client_id: string;
  scope: string;
  callback: (response: GoogleTokenResponse) => void;
  error_callback?: (error: { type?: string; message?: string }) => void;
}) => GoogleTokenClient };
type GoogleGlobal = { accounts?: { oauth2?: GoogleOAuthApi } };

export type GoogleAccount = { sub: string; email: string };
export type DriveSettingsFile = { fileId: string; modifiedTime?: string; raw: string };

let googleLibraryPromise: Promise<void> | undefined;

function googleOAuth(): GoogleOAuthApi {
  const api = (globalThis as typeof globalThis & { google?: GoogleGlobal }).google?.accounts?.oauth2;
  if (!api) throw new Error("Google sign-in could not be initialized. Reload the page and try again.");
  return api;
}

function loadGoogleIdentityLibrary(): Promise<void> {
  try {
    googleOAuth();
    return Promise.resolve();
  } catch {
    // Load the official Google Identity Services script when it is not present.
  }
  if (googleLibraryPromise) return googleLibraryPromise;
  googleLibraryPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GOOGLE_SCRIPT_URL}"]`);
    const script = existing ?? document.createElement("script");
    const onLoad = () => {
      try {
        googleOAuth();
        resolve();
      } catch (error) {
        reject(error);
      }
    };
    const onError = () => reject(new Error("Google sign-in library failed to load. Check your connection and try again."));
    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });
    if (!existing) {
      script.src = GOOGLE_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }).catch((error: unknown) => {
    googleLibraryPromise = undefined;
    throw error;
  });
  return googleLibraryPromise;
}

export async function requestGoogleAccessToken(clientId: string): Promise<string> {
  if (!clientId.trim()) throw new Error("Google sign-in is not configured yet. Add the Google OAuth client ID first.");
  await loadGoogleIdentityLibrary();
  return new Promise((resolve, reject) => {
    const client = googleOAuth().initTokenClient({
      client_id: clientId,
      scope: GOOGLE_DRIVE_SCOPE,
      callback: (response) => {
        if (response.access_token) resolve(response.access_token);
        else reject(new Error(response.error_description || response.error || "Google sign-in did not return an access token."));
      },
      error_callback: (error) => reject(new Error(error.message || error.type || "Google sign-in was cancelled.")),
    });
    client.requestAccessToken({ prompt: "select_account" });
  });
}

export async function getGoogleAccount(accessToken: string, fetcher: typeof fetch = fetch): Promise<GoogleAccount> {
  const response = await fetcher("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  await ensureOk(response);
  const identity = await response.json() as Partial<GoogleAccount>;
  if (!identity.sub || !identity.email) throw new Error("Google did not return a usable account identity.");
  return { sub: identity.sub, email: identity.email };
}

export async function readDriveSettings(accessToken: string, fetcher: typeof fetch = fetch): Promise<DriveSettingsFile | null> {
  const query = `name = '${SETTINGS_FILE_NAME}' and 'appDataFolder' in parents and trashed = false`;
  const listUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&spaces=appDataFolder&fields=files(id,name,modifiedTime)&pageSize=10`;
  const listResponse = await fetcher(listUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
  await ensureOk(listResponse);
  const listing = await listResponse.json() as { files?: Array<{ id?: string; modifiedTime?: string }> };
  const file = listing.files?.filter((item) => item.id).sort((a, b) => (b.modifiedTime ?? "").localeCompare(a.modifiedTime ?? ""))[0];
  if (!file?.id) return null;
  const contentResponse = await fetcher(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  await ensureOk(contentResponse);
  return { fileId: file.id, modifiedTime: file.modifiedTime, raw: await contentResponse.text() };
}

export async function writeDriveSettings(
  accessToken: string,
  raw: string,
  fileId?: string,
  fetcher: typeof fetch = fetch,
): Promise<{ fileId: string; modifiedTime?: string }> {
  const headers = { Authorization: `Bearer ${accessToken}` };
  let response: Response;
  if (fileId) {
    response = await fetcher(`https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fileId)}?uploadType=media&fields=id,modifiedTime`, {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: raw,
    });
  } else {
    const boundary = `capsuleShelf${Math.random().toString(36).slice(2)}`;
    const metadata = JSON.stringify({ name: SETTINGS_FILE_NAME, mimeType: "application/json", parents: ["appDataFolder"] });
    const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${raw}\r\n--${boundary}--`;
    response = await fetcher("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,modifiedTime", {
      method: "POST",
      headers: { ...headers, "Content-Type": `multipart/related; boundary=${boundary}` },
      body,
    });
  }
  await ensureOk(response);
  const result = await response.json() as { id?: string; modifiedTime?: string };
  if (!result.id && !fileId) throw new Error("Google Drive saved the settings but did not return a file ID.");
  return { fileId: result.id ?? fileId!, modifiedTime: result.modifiedTime };
}

async function ensureOk(response: Response): Promise<void> {
  if (response.ok) return;
  const details = response.status === 401 ? "Google access expired. Reconnect your account and try again." : `Google Drive request failed (${response.status}).`;
  throw new Error(details);
}
