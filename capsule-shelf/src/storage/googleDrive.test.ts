import { afterEach, describe, expect, it, vi } from "vitest";
import {
  GOOGLE_DRIVE_SCOPE,
  getGoogleAccount,
  readDriveSettings,
  requestGoogleAccessToken,
  writeDriveSettings,
} from "./googleDrive";

afterEach(() => vi.unstubAllGlobals());

describe("Google Drive settings client", () => {
  it("requests only OpenID profile and the appData scope", async () => {
    let callback: ((response: { access_token: string }) => void) | undefined;
    const requestAccessToken = vi.fn(() => callback?.({ access_token: "short-lived-token" }));
    const initTokenClient = vi.fn((options: { callback: (response: { access_token: string }) => void }) => {
      callback = options.callback;
      return { requestAccessToken };
    });
    vi.stubGlobal("google", { accounts: { oauth2: { initTokenClient } } });

    await expect(requestGoogleAccessToken("public-client-id")).resolves.toBe("short-lived-token");
    expect(initTokenClient).toHaveBeenCalledWith(expect.objectContaining({
      client_id: "public-client-id",
      scope: GOOGLE_DRIVE_SCOPE,
    }));
    expect(GOOGLE_DRIVE_SCOPE).toBe("openid email https://www.googleapis.com/auth/drive.appdata");
    expect(requestAccessToken).toHaveBeenCalledWith({ prompt: "select_account" });
  });

  it("loads the Google account identity using the access token", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ sub: "google-user-42", email: "user@example.com" }), { status: 200 }));
    await expect(getGoogleAccount("token", fetcher)).resolves.toEqual({ sub: "google-user-42", email: "user@example.com" });
    expect(fetcher).toHaveBeenCalledWith("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: "Bearer token" },
    });
  });

  it("returns null when the appData folder does not contain its settings file", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ files: [] }), { status: 200 }));
    await expect(readDriveSettings("token", fetcher)).resolves.toBeNull();
    const [url] = fetcher.mock.calls[0] as [string];
    expect(url).toContain("spaces=appDataFolder");
    expect(decodeURIComponent(url)).toContain("'appDataFolder' in parents");
    expect(decodeURIComponent(url)).toContain("capsule-shelf-settings.json");
  });

  it("downloads the current settings JSON from the appData file", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ files: [{ id: "file-1", name: "capsule-shelf-settings.json", modifiedTime: "2026-11-04T12:00:00.000Z" }] }), { status: 200 }))
      .mockResolvedValueOnce(new Response("{\"version\":1}", { status: 200 }));

    await expect(readDriveSettings("token", fetcher)).resolves.toEqual({
      fileId: "file-1",
      modifiedTime: "2026-11-04T12:00:00.000Z",
      raw: "{\"version\":1}",
    });
    expect(fetcher.mock.calls[1]?.[0]).toContain("files/file-1?alt=media");
  });

  it("creates one JSON file inside appDataFolder", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "new-file" }), { status: 200 }));
    await expect(writeDriveSettings("token", "{\"version\":1}", undefined, fetcher)).resolves.toEqual({ fileId: "new-file" });

    const [url, init] = fetcher.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,modifiedTime");
    expect(init.method).toBe("POST");
    expect(String(init.body)).toContain('"parents":["appDataFolder"]');
    expect(String(init.body)).toContain("{\"version\":1}");
  });

  it("updates the existing settings file without creating another one", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "file-1" }), { status: 200 }));
    await expect(writeDriveSettings("token", "{\"version\":2}", "file-1", fetcher)).resolves.toEqual({ fileId: "file-1" });
    const [url, init] = fetcher.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://www.googleapis.com/upload/drive/v3/files/file-1?uploadType=media&fields=id,modifiedTime");
    expect(init.method).toBe("PATCH");
    expect(init.body).toBe("{\"version\":2}");
  });

  it("surfaces expired-token responses so the UI can ask the user to reconnect", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response("{}", { status: 401 }));
    await expect(readDriveSettings("expired-token", fetcher)).rejects.toThrow(/401|expired|reconnect/i);
  });
});
