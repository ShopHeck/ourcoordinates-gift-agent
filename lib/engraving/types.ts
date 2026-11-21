export type CoordFormat = "dms" | "decimal";

export interface EngravingSpec {
  maxLines: number;
  maxCharsPerLine: number;
  /** Characters allowed in custom lines (names/dates). Coordinates have their own fixed charset. */
  allowedChars: string;
  format: CoordFormat;
  /** When true, lat and lng share one line; otherwise each gets its own. */
  singleLineCoords: boolean;
}

export interface FitResult {
  ok: boolean;
  lines: string[];
  format: CoordFormat;
  /** decimals for "decimal", seconds-decimals for "dms" */
  precision: number;
  accuracy_m: number;
  errors: string[];
}
