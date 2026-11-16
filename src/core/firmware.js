const PLAYSTATION_UA = /PlayStation\s+(\d+)[/ ](\d+)\.(\d+)/i;

/**
 * Parse a PlayStation browser user-agent without making a compatibility claim.
 * Wobkot interprets the minor component as hexadecimal; preserve that behavior.
 */
export function parsePlayStationUserAgent(userAgent = "") {
  const match = PLAYSTATION_UA.exec(String(userAgent));
  if (!match) return { detected: false, console: null, major: null, minor: null, version: null };
  const consoleVersion = Number.parseInt(match[1], 10);
  const major = Number.parseInt(match[2], 10);
  const minor = Number.parseInt(match[3], 16);
  if (![consoleVersion, major, minor].every(Number.isFinite)) {
    return { detected: false, console: null, major: null, minor: null, version: null };
  }
  return {
    detected: true,
    console: consoleVersion,
    major,
    minor,
    version: `${major}.${minor.toString(16).padStart(2, "0")}`,
  };
}

export function detectBrowserEnvironment(userAgent = "") {
  const parsed = parsePlayStationUserAgent(userAgent);
  return {
    ...parsed,
    isPS5: parsed.detected && parsed.console === 5,
    isPS4: parsed.detected && parsed.console === 4,
    isPlayStation: parsed.detected,
  };
}
