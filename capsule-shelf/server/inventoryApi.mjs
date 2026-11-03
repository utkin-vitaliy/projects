import { createServer } from "node:http";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { readInventoryFile, validateInventoryPayload, writeInventoryFile } from "./inventoryStore.mjs";

const MAX_BODY_BYTES = 1024 * 1024;

function respond(response, status, payload) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  response.end(JSON.stringify(payload));
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;
  let tooLarge = false;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      tooLarge = true;
      continue;
    }
    chunks.push(chunk);
  }
  if (tooLarge) {
    const error = new Error("Request body exceeds 1 MiB.");
    error.statusCode = 413;
    throw error;
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const error = new Error("Request body must be valid JSON.");
    error.statusCode = 400;
    throw error;
  }
}

export function createInventoryServer({ filePath }) {
  if (typeof filePath !== "string" || filePath.length === 0) {
    throw new TypeError("filePath is required.");
  }

  return createServer(async (request, response) => {
    const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
    if (requestUrl.pathname !== "/api/inventory") {
      respond(response, 404, { error: "Not found." });
      return;
    }

    if (request.method === "GET") {
      try {
        respond(response, 200, await readInventoryFile(filePath));
      } catch {
        respond(response, 500, { error: "Could not read the inventory file." });
      }
      return;
    }

    if (request.method === "PUT") {
      let payload;
      try {
        payload = await readJsonBody(request);
      } catch (error) {
        respond(response, error.statusCode ?? 400, { error: error.message });
        return;
      }
      if (!validateInventoryPayload(payload)) {
        respond(response, 400, { error: "Inventory payload is invalid." });
        return;
      }
      try {
        await writeInventoryFile(filePath, payload);
        respond(response, 200, { ok: true });
      } catch {
        respond(response, 500, { error: "Could not save the inventory file." });
      }
      return;
    }

    response.setHeader("allow", "GET, PUT");
    respond(response, 405, { error: "Method not allowed." });
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const filePath = resolve(process.cwd(), "data/inventory.json");
  const port = Number(process.env.INVENTORY_API_PORT ?? 3001);
  const server = createInventoryServer({ filePath });
  server.listen(port, "127.0.0.1", () => {
    process.stdout.write(`Inventory API listening on http://127.0.0.1:${port}\n`);
  });
  const stop = () => server.close(() => process.exit(0));
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
}
