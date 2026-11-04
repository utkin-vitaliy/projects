export const REMEMBERED_GOOGLE_ACCOUNT_KEY = "capsule-shelf:google-account:v1";

export type RememberedGoogleAccount = { sub: string; email: string };

export function readRememberedGoogleAccount(): RememberedGoogleAccount | null {
  try {
    const raw = window.localStorage.getItem(REMEMBERED_GOOGLE_ACCOUNT_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const { sub, email } = parsed as Record<string, unknown>;
    if (typeof sub !== "string" || !sub.trim() || typeof email !== "string" || !email.trim()) return null;
    return { sub, email };
  } catch {
    return null;
  }
}

export function rememberGoogleAccount(account: RememberedGoogleAccount): void {
  try {
    window.localStorage.setItem(REMEMBERED_GOOGLE_ACCOUNT_KEY, JSON.stringify({ sub: account.sub, email: account.email }));
  } catch {
    // The current session can still use Drive even when browser storage is unavailable.
  }
}

export function clearRememberedGoogleAccount(): void {
  try {
    window.localStorage.removeItem(REMEMBERED_GOOGLE_ACCOUNT_KEY);
  } catch {
    // Keep the in-memory disconnect action available when browser storage is blocked.
  }
}
