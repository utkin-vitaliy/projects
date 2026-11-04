export type SettingsNamespace = { provider: "google"; subject: string } | null;

export function settingsStorageKey(baseKey: string, namespace: SettingsNamespace): string {
  if (!namespace) return baseKey;
  return `${baseKey}:google:${encodeURIComponent(namespace.subject)}`;
}

export function readSettingsFile(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeSettingsFile(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}
