import { beforeEach, describe, expect, it } from "vitest";
import {
  clearRememberedGoogleAccount,
  readRememberedGoogleAccount,
  rememberGoogleAccount,
  REMEMBERED_GOOGLE_ACCOUNT_KEY,
} from "./rememberedGoogleAccount";

describe("remembered Google account", () => {
  beforeEach(() => localStorage.clear());

  it("stores only the account identity and reads it after reload", () => {
    rememberGoogleAccount({ sub: "google-user-123", email: "user@example.com" });

    expect(readRememberedGoogleAccount()).toEqual({ sub: "google-user-123", email: "user@example.com" });
    expect(localStorage.getItem(REMEMBERED_GOOGLE_ACCOUNT_KEY)).not.toContain("accessToken");
  });

  it("ignores malformed account data", () => {
    localStorage.setItem(REMEMBERED_GOOGLE_ACCOUNT_KEY, "not-json");
    expect(readRememberedGoogleAccount()).toBeNull();
  });

  it("clears the account when Google Drive is disconnected", () => {
    rememberGoogleAccount({ sub: "google-user-123", email: "user@example.com" });
    clearRememberedGoogleAccount();
    expect(readRememberedGoogleAccount()).toBeNull();
  });
});
