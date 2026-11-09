import test from "node:test";
import assert from "node:assert/strict";
import { assemble, splitPayload } from "./protocol.js";

test("splits and reassembles an expiring pairing payload", () => {
  const expiresAt = Date.now() + 60_000;
  const parts = splitPayload("offer", "session-123", expiresAt, "x".repeat(2_000), 300);
  assert.ok(parts.length > 1);
  assert.equal(assemble([...parts].reverse()).data, "x".repeat(2_000));
});

test("rejects mismatched sessions and expired payloads", () => {
  const now = Date.now();
  const parts = splitPayload("answer", "session-123", now - 1, "hello", 300);
  assert.throws(() => assemble(parts, now), /expired/);
  const valid = splitPayload("answer", "session-123", now + 60_000, "x".repeat(500), 300);
  valid[1] = valid[1].replace("session-123", "session-456");
  assert.throws(() => assemble(valid, now), /session/);
});

test("rejects duplicate, corrupted, and oversized pairing data", () => {
  const now = Date.now();
  const parts = splitPayload("offer", "session-123", now + 60_000, "x".repeat(500), 300);
  assert.throws(() => assemble([parts[0], parts[0]], now), /More QR frames/);
  const corrupt = [...parts]; corrupt[1] = `${corrupt[1]}x`;
  assert.throws(() => assemble(corrupt, now), /Invalid pairing code|integrity/);
  assert.throws(() => splitPayload("offer", "session-123", now + 60_000, "x".repeat(24_001)), /too large/);
});
