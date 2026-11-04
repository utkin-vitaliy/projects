import { describe, expect, it } from "vitest";
import { settingsStorageKey } from "./settingsStorage";

describe("account-scoped settings keys", () => {
  it("keeps guest settings on the existing browser key", () => {
    expect(settingsStorageKey("capsule-shelf:inventory:v2", null)).toBe("capsule-shelf:inventory:v2");
  });

  it("isolates each Google account and safely encodes its subject", () => {
    expect(settingsStorageKey("capsule-shelf:inventory:v2", { provider: "google", subject: "a/b" }))
      .toBe("capsule-shelf:inventory:v2:google:a%2Fb");
    expect(settingsStorageKey("capsule-shelf:inventory:v2", { provider: "google", subject: "other" }))
      .not.toBe(settingsStorageKey("capsule-shelf:inventory:v2", { provider: "google", subject: "a/b" }));
  });
});
