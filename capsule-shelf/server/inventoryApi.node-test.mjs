import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, test } from "node:test";
import { createInventoryServer } from "./inventoryApi.mjs";

const running = new Set();

async function startApi() {
  const directory = await mkdtemp(join(tmpdir(), "capsule-shelf-api-"));
  const filePath = join(directory, "inventory.json");
  const server = createInventoryServer({ filePath });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const api = { directory, filePath, server, baseUrl: `http://127.0.0.1:${address.port}` };
  running.add(api);
  return api;
}

afterEach(async () => {
  await Promise.all([...running].map(async ({ directory, server }) => {
    await new Promise((resolve) => server.close(resolve));
    await rm(directory, { recursive: true, force: true });
  }));
  running.clear();
});

test("returns an empty state when the JSON file has not been created", async () => {
  const { baseUrl } = await startApi();
  const response = await fetch(`${baseUrl}/api/inventory`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { exists: false });
});

test("round-trips versioned inventory to the JSON file", async () => {
  const { baseUrl, filePath } = await startApi();
  const payload = {
    version: 1,
    inventory: {
      arpeggio: {
        quantity: 7,
        favorite: true,
        threshold: 3,
        note: { rating: "like", tastingNotes: "Какао", recipes: "Капучино", suitableFor: "Эспрессо", unsuitableFor: "Лунго" },
      },
    },
  };

  const put = await fetch(`${baseUrl}/api/inventory`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const get = await fetch(`${baseUrl}/api/inventory`);

  assert.equal(put.status, 200);
  assert.deepEqual(await put.json(), { ok: true });
  assert.deepEqual(await get.json(), { exists: true, ...payload });
  assert.deepEqual(JSON.parse(await readFile(filePath, "utf8")), payload);
});

test("rejects unsupported schemas and invalid inventory fields", async () => {
  const { baseUrl } = await startApi();
  const validEntry = { quantity: 2, favorite: true, threshold: 5, note: { rating: "like", tastingNotes: "", recipes: "", suitableFor: "", unsuitableFor: "" } };
  const invalidPayloads = [
    { version: 2, inventory: {} },
    { version: 1, inventory: { arpeggio: { ...validEntry, quantity: -1 } } },
    { version: 1, inventory: { arpeggio: { ...validEntry, quantity: 1.5 } } },
    { version: 1, inventory: { arpeggio: { ...validEntry, threshold: -1 } } },
    { version: 1, inventory: { arpeggio: { ...validEntry, note: { ...validEntry.note, rating: "excellent" } } } },
    { version: 1, inventory: { arpeggio: { ...validEntry, note: { ...validEntry.note, recipes: 42 } } } },
  ];

  for (const payload of invalidPayloads) {
    const response = await fetch(`${baseUrl}/api/inventory`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    assert.equal(response.status, 400);
  }
});

test("returns a controlled error for malformed and oversized requests", async () => {
  const { baseUrl } = await startApi();
  const malformed = await fetch(`${baseUrl}/api/inventory`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: "{",
  });
  const oversized = await fetch(`${baseUrl}/api/inventory`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: " ".repeat(1024 * 1024 + 1),
  });

  assert.equal(malformed.status, 400);
  assert.equal(oversized.status, 413);
});

test("reports a malformed existing file without overwriting it", async () => {
  const { baseUrl, filePath } = await startApi();
  await writeFile(filePath, "{broken", "utf8");

  const response = await fetch(`${baseUrl}/api/inventory`);

  assert.equal(response.status, 500);
  assert.equal(await readFile(filePath, "utf8"), "{broken");
});

test("rejected writes preserve the previous JSON file", async () => {
  const { baseUrl, filePath } = await startApi();
  const existing = JSON.stringify({ version: 1, inventory: {} });
  await writeFile(filePath, existing, "utf8");

  const response = await fetch(`${baseUrl}/api/inventory`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ version: 1, inventory: { arpeggio: { quantity: -2 } } }),
  });

  assert.equal(response.status, 400);
  assert.equal(await readFile(filePath, "utf8"), existing);
});
