import { afterEach, describe, expect, it, vi } from "vitest";
import { readInventory, writeInventory } from "./inventoryApi";

const response = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
}) as Response;

afterEach(() => vi.unstubAllGlobals());

describe("inventory API adapter", () => {
  it("reads persisted inventory from the local API", async () => {
    const inventory = { arpeggio: { quantity: 4 } };
    const fetchMock = vi.fn().mockResolvedValue(response({ exists: true, version: 1, inventory }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(readInventory()).resolves.toEqual({ exists: true, inventory });
    expect(fetchMock).toHaveBeenCalledWith("/api/inventory", { headers: { accept: "application/json" } });
  });

  it("reports a missing file without inventing file data", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ exists: false })));

    await expect(readInventory()).resolves.toEqual({ exists: false, inventory: {} });
  });

  it("rejects malformed server responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ exists: true, version: 2, inventory: {} })));

    await expect(readInventory()).rejects.toThrow("Could not load inventory");
  });

  it("sends versioned data and rejects unsuccessful writes", async () => {
    const inventory = { arpeggio: { quantity: 4 } } as never;
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response({ ok: true }))
      .mockResolvedValueOnce(response({ error: "disk full" }, 500));
    vi.stubGlobal("fetch", fetchMock);

    await expect(writeInventory(inventory)).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/inventory", {
      method: "PUT",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ version: 1, inventory }),
    });
    await expect(writeInventory(inventory)).rejects.toThrow("Could not save inventory");
  });
});
