// Pure coordinate formatting. No I/O. (R3)

export type Hemi = { lat: "N" | "S"; lng: "E" | "W" };

export function hemispheres(lat: number, lng: number): Hemi {
  return { lat: lat < 0 ? "S" : "N", lng: lng < 0 ? "W" : "E" };
}

export function assertValid(lat: number, lng: number): void {
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) throw new RangeError(`Invalid latitude ${lat}`);
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) throw new RangeError(`Invalid longitude ${lng}`);
}

/** Decimal degrees, e.g. "40.74844° N, 73.98566° W" (style "hemi") or "40.74844, -73.98566" (style "signed"). */
export function formatDecimal(
  lat: number,
  lng: number,
  decimals: number,
  style: "hemi" | "signed" = "hemi",
): { lat: string; lng: string } {
  assertValid(lat, lng);
  if (style === "signed") return { lat: lat.toFixed(decimals), lng: lng.toFixed(decimals) };
  const h = hemispheres(lat, lng);
  return {
    lat: `${Math.abs(lat).toFixed(decimals)}° ${h.lat}`,
    lng: `${Math.abs(lng).toFixed(decimals)}° ${h.lng}`,
  };
}

function toDMS(value: number, secDecimals: number) {
  const abs = Math.abs(value);
  let d = Math.floor(abs);
  let m = Math.floor((abs - d) * 60);
  let s = Number(((abs - d - m / 60) * 3600).toFixed(secDecimals));
  // carry when rounding pushes seconds/minutes to 60
  if (s >= 60) { s -= 60; m += 1; }
  if (m >= 60) { m -= 60; d += 1; }
  return { d, m, s };
}

/** DMS, e.g. 40°44'54.4"N 73°59'08.4"W */
export function formatDMS(lat: number, lng: number, secDecimals = 1): { lat: string; lng: string } {
  assertValid(lat, lng);
  const h = hemispheres(lat, lng);
  const fmt = (v: number, hemi: string) => {
    const { d, m, s } = toDMS(v, secDecimals);
    const sStr = s.toFixed(secDecimals).padStart(secDecimals > 0 ? 3 + secDecimals : 2, "0");
    return `${d}°${String(m).padStart(2, "0")}'${sStr}"${hemi}`;
  };
  return { lat: fmt(lat, h.lat), lng: fmt(lng, h.lng) };
}

/** Parse our own output back to signed decimal degrees (used to verify round-trip accuracy). */
export function parseDMS(s: string): number {
  const m = s.match(/^(\d+)°(\d+)'([\d.]+)"([NSEW])$/);
  if (!m) throw new Error(`Bad DMS: ${s}`);
  const v = Number(m[1]) + Number(m[2]) / 60 + Number(m[3]) / 3600;
  return m[4] === "S" || m[4] === "W" ? -v : v;
}

export function parseDecimalHemi(s: string): number {
  const m = s.match(/^([\d.]+)° ([NSEW])$/);
  if (!m) throw new Error(`Bad decimal: ${s}`);
  const v = Number(m[1]);
  return m[2] === "S" || m[2] === "W" ? -v : v;
}
