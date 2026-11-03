import type { InventoryState } from "../domain/capsules";

type ReadInventoryResult = { exists: boolean; inventory: InventoryState };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function readInventory(): Promise<ReadInventoryResult> {
  let response: Response;
  try {
    response = await fetch("/api/inventory", { headers: { accept: "application/json" } });
  } catch {
    throw new Error("Could not load inventory.");
  }
  if (!response.ok) throw new Error("Could not load inventory.");

  let result: unknown;
  try {
    result = await response.json();
  } catch {
    throw new Error("Could not load inventory.");
  }
  if (!isRecord(result)) throw new Error("Could not load inventory.");
  if (result.exists === false) return { exists: false, inventory: {} };
  if (result.exists !== true || result.version !== 1 || !isRecord(result.inventory)) {
    throw new Error("Could not load inventory.");
  }
  return { exists: true, inventory: result.inventory as InventoryState };
}

let writeQueue: Promise<void> = Promise.resolve();

export function writeInventory(inventory: InventoryState): Promise<void> {
  const write = writeQueue.catch(() => {}).then(async () => {
    let response: Response;
    try {
      response = await fetch("/api/inventory", {
        method: "PUT",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ version: 1, inventory }),
      });
    } catch {
      throw new Error("Could not save inventory.");
    }
    if (!response.ok) throw new Error("Could not save inventory.");
  });
  writeQueue = write;
  return write;
}
