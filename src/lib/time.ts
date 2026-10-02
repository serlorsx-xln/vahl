/** Tromsø: 69.6492° N, 18.9553° E, Europe/Oslo */
export const TROMSO = { lat: 69.6492, lon: 18.9553, tz: "Europe/Oslo" };

/** Offset (ms) between UTC and Tromsø wall-clock time at a given instant */
export function tromsoOffsetMs(at = Date.now()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TROMSO.tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(at));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const asUTC = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUTC - Math.floor(at / 1000) * 1000;
}

let cachedOffset = 0;
let cachedAt = -Infinity;

/** Wall-clock parts in Tromsø, cheap enough to call every frame */
export function tromsoClock(now = Date.now()) {
  if (now - cachedAt > 60_000) {
    cachedOffset = tromsoOffsetMs(now);
    cachedAt = now;
  }
  const local = now + cachedOffset;
  const msOfDay = ((local % 86_400_000) + 86_400_000) % 86_400_000;
  const h = Math.floor(msOfDay / 3_600_000);
  const m = Math.floor((msOfDay % 3_600_000) / 60_000);
  const s = Math.floor((msOfDay % 60_000) / 1000);
  const ms = msOfDay % 1000;
  return { h, m, s, ms, msOfDay };
}

export const pad = (n: number, w = 2) => String(Math.max(0, Math.floor(n))).padStart(w, "0");

/**
 * Requests close as mørketid begins: 27 November, 00:00 in Tromsø
 * (CET, UTC+1). After that date it rolls to the next year.
 */
export function requestDeadline(now = Date.now()) {
  const year = new Date(now).getUTCFullYear();
  let deadline = Date.UTC(year, 10, 26, 23, 0, 0);
  if (now > deadline) deadline = Date.UTC(year + 1, 10, 26, 23, 0, 0);
  const editionYear = new Date(deadline).getUTCFullYear() + 1;
  return { deadline, editionYear };
}

export function countdown(now = Date.now()) {
  const { deadline } = requestDeadline(now);
  const diff = Math.max(0, deadline - now);
  return {
    d: Math.floor(diff / 86_400_000),
    h: Math.floor((diff % 86_400_000) / 3_600_000),
    m: Math.floor((diff % 3_600_000) / 60_000),
    s: Math.floor((diff % 60_000) / 1000),
  };
}

/** Solar elevation in degrees (NOAA low-precision algorithm, ~0.5° accuracy) */
export function solarElevation(now = Date.now(), lat = TROMSO.lat, lon = TROMSO.lon) {
  const rad = Math.PI / 180;
  const jd = now / 86_400_000 + 2_440_587.5;
  const n = jd - 2_451_545.0;
  const L = (280.46 + 0.9856474 * n) % 360;
  const g = ((357.528 + 0.9856003 * n) % 360) * rad;
  const lambda = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * rad;
  const epsilon = (23.439 - 0.0000004 * n) * rad;
  const decl = Math.asin(Math.sin(epsilon) * Math.sin(lambda));
  const ra = Math.atan2(Math.cos(epsilon) * Math.sin(lambda), Math.cos(lambda));
  const gmst = (18.697374558 + 24.06570982441908 * n) % 24;
  const lst = (gmst * 15 + lon) * rad;
  const ha = lst - ra;
  const el = Math.asin(
    Math.sin(lat * rad) * Math.sin(decl) + Math.cos(lat * rad) * Math.cos(decl) * Math.cos(ha),
  );
  return el / rad;
}

export function daysUntilMorketid(now = Date.now()) {
  return countdown(now).d;
}
