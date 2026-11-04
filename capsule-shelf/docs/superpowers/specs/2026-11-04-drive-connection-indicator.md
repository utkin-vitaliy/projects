# Google Drive Connection Indicator

## Intent

Keep the user's Google Drive choice visible after reload and replace the footer controls with a small, clear sync control in the upper-right header. The control must communicate disconnected, linked/remembered, active sync, and error states without exposing the account email in the header.

## Design

- Place a circular 44px-or-larger Google Drive control immediately before the language buttons in the header.
- A neutral pair of arrows means not connected; a green status treatment means Google is linked; animated arrows mean settings are being saved; errors get a distinct accessible status.
- Use an accessible changing label and tooltip/status text so color and animation are not the only signals. Respect `prefers-reduced-motion`.
- Clicking while not actively connected starts Google OAuth. Clicking while connected opens a compact popover with status and an explicit disconnect action.
- Persist only the selected Google account identifier and email in this browser. Do not persist access tokens. On reload, show the remembered link state and let the user explicitly resume OAuth; Google's browser token model requires user interaction and does not promise silent refresh.
- Clear remembered account metadata when the user disconnects. Continue storing settings in localStorage and the existing Google Drive `appDataFolder` JSON.
- Apple and GitHub are future integrations; do not show misleading nonfunctional provider buttons in this iteration.

## Alternatives Considered

1. Store a refresh token in the static app: rejected because client-side tokens cannot be kept secret and the current Google token model does not provide persistent browser refresh tokens.
2. Add a server-side OAuth broker now: deferred because the user chose to keep the app static and asked for a local UI change.
3. Remember account metadata and request a fresh token from an explicit button after reload: selected; this preserves the chosen account without retaining bearer credentials.

## Scope and Acceptance

- A reload retains the linked account identity and selects that account's local settings namespace.
- No access token is written to localStorage.
- The header control starts OAuth when it needs authorization, reflects sync progress, and exposes disconnect when connected.
- Apple and GitHub are not represented as working integrations.
- Existing inventory, language controls, and backup actions remain functional.
