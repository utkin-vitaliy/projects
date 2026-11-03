import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const ratings = new Set(["like", "neutral", "dislike", null]);

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSafeCount(value) {
  return Number.isSafeInteger(value) && value >= 0;
}

export function validateInventoryPayload(value) {
  if (!isRecord(value) || value.version !== 1 || !isRecord(value.inventory)) return false;

  return Object.values(value.inventory).every((entry) => (
    isRecord(entry)
    && isSafeCount(entry.quantity)
    && typeof entry.favorite === "boolean"
    && isSafeCount(entry.threshold)
    && isRecord(entry.note)
    && ratings.has(entry.note.rating)
    && ["tastingNotes", "recipes", "suitableFor", "unsuitableFor"]
      .every((field) => typeof entry.note[field] === "string")
  ));
}

export async function readInventoryFile(filePath) {
  let raw;
  try {
    raw = await readFile(filePath, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return { exists: false };
    throw error;
  }

  const payload = JSON.parse(raw);
  if (!validateInventoryPayload(payload)) {
    throw new Error("Inventory file has an unsupported or invalid structure.");
  }
  return { exists: true, ...payload };
}

export async function writeInventoryFile(filePath, payload) {
  if (!validateInventoryPayload(payload)) {
    throw new TypeError("Inventory payload is invalid.");
  }

  await mkdir(dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporaryPath, `${JSON.stringify(payload, null, 2)}\n`, { encoding: "utf8", flag: "wx", mode: 0o600 });
    await rename(temporaryPath, filePath);
  } catch (error) {
    await rm(temporaryPath, { force: true }).catch(() => {});
    throw error;
  }
}
