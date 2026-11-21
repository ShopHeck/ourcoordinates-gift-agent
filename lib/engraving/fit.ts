// Fit confirmed coordinates + optional custom lines to a product's engraving limits. Pure. (R3)
import { formatDecimal, formatDMS } from "./format";
import { decimalAccuracyM, dmsAccuracyM } from "./accuracy";
import type { EngravingSpec, FitResult } from "./types";

export const DECIMAL_MAX = 6;
export const DECIMAL_MIN = 4; // ~11 m worst case
export const DMS_MAX = 2;
export const DMS_MIN = 1; // ~3 m worst case

export function validateCustomLine(line: string, spec: EngravingSpec): string | null {
  if (line.length === 0) return "Line is empty";
  if (line.length > spec.maxCharsPerLine) return `"${line}" is ${line.length} characters; max is ${spec.maxCharsPerLine}`;
  const allowed = new Set(spec.allowedChars);
  const bad = [...new Set([...line].filter((c) => !allowed.has(c)))];
  if (bad.length) return `"${line}" has characters we can't engrave: ${bad.join(" ")}`;
  return null;
}

function coordLines(lat: number, lng: number, spec: EngravingSpec, precision: number): string[] {
  const c = spec.format === "dms" ? formatDMS(lat, lng, precision) : formatDecimal(lat, lng, precision);
  return spec.singleLineCoords ? [`${c.lat} ${c.lng}`] : [c.lat, c.lng];
}

export function fitEngraving(lat: number, lng: number, spec: EngravingSpec, extraLines: string[] = []): FitResult {
  const errors: string[] = [];
  for (const l of extraLines) {
    const e = validateCustomLine(l, spec);
    if (e) errors.push(e);
  }

  const [hi, lo] = spec.format === "dms" ? [DMS_MAX, DMS_MIN] : [DECIMAL_MAX, DECIMAL_MIN];
  const acc = spec.format === "dms" ? dmsAccuracyM : decimalAccuracyM;

  for (let p = hi; p >= lo; p--) {
    const lines = [...coordLines(lat, lng, spec, p), ...extraLines];
    const fits = lines.length <= spec.maxLines && lines.every((l) => l.length <= spec.maxCharsPerLine);
    if (fits) {
      return { ok: errors.length === 0, lines, format: spec.format, precision: p, accuracy_m: acc(p), errors };
    }
  }

  const lines = [...coordLines(lat, lng, spec, lo), ...extraLines];
  if (lines.length > spec.maxLines) errors.push(`Needs ${lines.length} lines; this piece fits ${spec.maxLines}`);
  else errors.push(`Coordinates don't fit ${spec.maxCharsPerLine} characters per line even at minimum precision`);
  return { ok: false, lines, format: spec.format, precision: lo, accuracy_m: acc(lo), errors };
}
