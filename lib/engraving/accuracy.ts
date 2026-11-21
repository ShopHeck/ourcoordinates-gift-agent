// Worst-case ground error (meters) introduced by rounding at a given precision.
const M_PER_DEG_LAT = 111_320;

/** Max rounding error in meters for decimal degrees rounded to `decimals` places (half a unit, on both axes). */
export function decimalAccuracyM(decimals: number): number {
  const halfUnitDeg = 0.5 * 10 ** -decimals;
  // worst case: equator for longitude; combine both axes
  return Math.hypot(halfUnitDeg, halfUnitDeg) * M_PER_DEG_LAT;
}

/** Max rounding error in meters for DMS seconds rounded to `secDecimals` places. */
export function dmsAccuracyM(secDecimals: number): number {
  const halfUnitDeg = (0.5 * 10 ** -secDecimals) / 3600;
  return Math.hypot(halfUnitDeg, halfUnitDeg) * M_PER_DEG_LAT;
}

/** Great-circle-ish distance (equirectangular, fine at these scales). */
export function distanceM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = Math.PI / 180;
  let dLng = Math.abs(lng2 - lng1);
  if (dLng > 180) dLng = 360 - dLng;
  const x = dLng * toRad * Math.cos(((lat1 + lat2) / 2) * toRad);
  const y = (lat2 - lat1) * toRad;
  return Math.hypot(x, y) * 6_371_000;
}
