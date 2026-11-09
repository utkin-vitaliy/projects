const PREFIX = "WT1";
const MAX_PARTS = 40;
const MAX_DATA_LENGTH = 24_000;

export function splitPayload(kind, sessionId, expiresAt, data, chunkSize = 700) {
  if (!/^(offer|answer)$/.test(kind)) throw new Error("Unsupported pairing payload.");
  if (!/^[a-z0-9-]{8,64}$/i.test(sessionId)) throw new Error("Invalid session id.");
  if (!Number.isInteger(chunkSize) || chunkSize < 100 || chunkSize > 900) throw new Error("Invalid QR frame size.");
  if (data.length > MAX_DATA_LENGTH) throw new Error("Pairing payload is too large.");
  const encoded = base64UrlEncode(data);
  const checksum = digest(encoded);
  const chunks = encoded.match(new RegExp(`.{1,${chunkSize}}`, "g")) ?? [""];
  if (chunks.length > MAX_PARTS) throw new Error("Pairing payload is too large.");
  return chunks.map((chunk, index) => `${PREFIX}|${kind}|${sessionId}|${expiresAt}|${checksum}|${index + 1}|${chunks.length}|${chunk}`);
}

export function parsePart(value) {
  const fields = value.trim().split("|");
  if (fields.length !== 8 || fields[0] !== PREFIX) throw new Error("This is not a Walkie pairing code.");
  const [, kind, sessionId, rawExpiry, checksum, rawIndex, rawTotal, chunk] = fields;
  const expiresAt = Number(rawExpiry); const index = Number(rawIndex); const total = Number(rawTotal);
  if (!/^(offer|answer)$/.test(kind) || !/^[a-z0-9-]{8,64}$/i.test(sessionId) || !Number.isSafeInteger(expiresAt) || !/^[a-f0-9]{8}$/.test(checksum) || !Number.isInteger(index) || !Number.isInteger(total) || total < 1 || total > MAX_PARTS || index < 1 || index > total || chunk.length > 900 || !/^[A-Za-z0-9_-]*$/.test(chunk)) throw new Error("Invalid pairing code.");
  return { kind, sessionId, expiresAt, checksum, index, total, chunk };
}

export function assemble(values, now = Date.now()) {
  const parts = values.map(parsePart);
  if (!parts.length) throw new Error("No pairing code received.");
  const first = parts[0];
  if (first.expiresAt <= now) throw new Error("This pairing code has expired. Start again.");
  if (parts.length !== first.total || new Set(parts.map(({ index }) => index)).size !== first.total) throw new Error("More QR frames are needed.");
  if (parts.some((part) => part.kind !== first.kind || part.sessionId !== first.sessionId || part.expiresAt !== first.expiresAt || part.checksum !== first.checksum || part.total !== first.total)) throw new Error("QR frames belong to different sessions.");
  const encoded = [...parts].sort((a, b) => a.index - b.index).map(({ chunk }) => chunk).join("");
  if (encoded.length > MAX_DATA_LENGTH * 2 || digest(encoded) !== first.checksum) throw new Error("QR frames failed their integrity check.");
  return { kind: first.kind, sessionId: first.sessionId, expiresAt: first.expiresAt, data: base64UrlDecode(encoded) };
}

function digest(value) { let hash = 0x811c9dc5; for (let index = 0; index < value.length; index += 1) { hash ^= value.charCodeAt(index); hash = Math.imul(hash, 0x01000193); } return (hash >>> 0).toString(16).padStart(8, "0"); }

function base64UrlEncode(value) { return btoa(unescape(encodeURIComponent(value))).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", ""); }
function base64UrlDecode(value) { return decodeURIComponent(escape(atob(value.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat((4 - value.length % 4) % 4)))); }
