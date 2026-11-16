import test from "node:test";
import assert from "node:assert/strict";
import { detectBrowserEnvironment, parsePlayStationUserAgent } from "../src/core/firmware.js";

test("parses a PS5 user-agent and preserves Wobkot hexadecimal minor version behavior", () => {
  const result = parsePlayStationUserAgent("Mozilla/5.0 (PlayStation 5/9.60) AppleWebKit/605.1.15");
  assert.equal(result.detected, true);
  assert.equal(result.console, 5);
  assert.equal(result.major, 9);
  assert.equal(result.minor, 0x60);
  assert.equal(result.version, "9.60");
});

test("identifies PS4 separately from PS5", () => {
  const result = detectBrowserEnvironment("Mozilla/5.0 (PlayStation 4/11.00) AppleWebKit/605.1.15");
  assert.equal(result.isPS4, true);
  assert.equal(result.isPS5, false);
});

test("returns an undetected result for desktop browsers", () => {
  const result = parsePlayStationUserAgent("Mozilla/5.0 Chrome/120.0.0.0");
  assert.equal(result.detected, false);
  assert.equal(result.version, null);
});

test("rejects malformed version values without throwing", () => {
  const result = parsePlayStationUserAgent("PlayStation 5/not-a-version");
  assert.equal(result.detected, false);
});
