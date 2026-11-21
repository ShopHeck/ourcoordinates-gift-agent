import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { fitEngraving, validateCustomLine } from "@/lib/engraving/fit";
import { parseDMS, parseDecimalHemi } from "@/lib/engraving/format";
import { distanceM } from "@/lib/engraving/accuracy";
import { products } from "@/lib/catalog";
import type { EngravingSpec } from "@/lib/engraving/types";

const lat = fc.double({ min: -90, max: 90, noNaN: true });
const lng = fc.double({ min: -180, max: 180, noNaN: true });
const specArb: fc.Arbitrary<EngravingSpec> = fc.record({
  maxLines: fc.integer({ min: 1, max: 5 }),
  maxCharsPerLine: fc.integer({ min: 8, max: 40 }),
  allowedChars: fc.constant("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 "),
  format: fc.constantFrom("dms" as const, "decimal" as const),
  singleLineCoords: fc.boolean(),
});

describe("fitEngraving properties", () => {
  it("ok results never exceed line or character limits", () => {
    fc.assert(fc.property(lat, lng, specArb, (a, b, spec) => {
      const r = fitEngraving(a, b, spec);
      if (r.ok) {
        expect(r.lines.length).toBeLessThanOrEqual(spec.maxLines);
        for (const l of r.lines) expect(l.length).toBeLessThanOrEqual(spec.maxCharsPerLine);
      }
    }), { numRuns: 500 });
  });

  it("round-trip error is within the reported accuracy", () => {
    const twoLine = (format: "dms" | "decimal"): EngravingSpec =>
      ({ maxLines: 2, maxCharsPerLine: 40, allowedChars: "", format, singleLineCoords: false });
    fc.assert(fc.property(lat, lng, fc.constantFrom("dms" as const, "decimal" as const), (a, b, format) => {
      const r = fitEngraving(a, b, twoLine(format));
      expect(r.ok).toBe(true);
      const parse = format === "dms" ? parseDMS : parseDecimalHemi;
      const [pa, pb] = [parse(r.lines[0]), parse(r.lines[1])];
      expect(distanceM(a, b, pa, pb)).toBeLessThanOrEqual(r.accuracy_m + 1e-6);
    }), { numRuns: 1000 });
  });

  it("never drops below minimum precision", () => {
    fc.assert(fc.property(lat, lng, specArb, (a, b, spec) => {
      const r = fitEngraving(a, b, spec);
      expect(r.precision).toBeGreaterThanOrEqual(spec.format === "dms" ? 1 : 4);
    }));
  });

  it("every catalog product fits bare coordinates anywhere on Earth", () => {
    fc.assert(fc.property(lat, lng, (a, b) => {
      for (const p of products) expect(fitEngraving(a, b, p.engraving).ok).toBe(true);
    }), { numRuns: 300 });
  });
});

describe("validateCustomLine", () => {
  const spec = products[0].engraving;
  it("accepts a name and date", () => expect(validateCustomLine("Mike & Ana 06/14/25", spec)).toBeNull());
  it("rejects emoji", () => expect(validateCustomLine("Love 😍", spec)).toMatch(/can't engrave/));
  it("rejects long lines", () => expect(validateCustomLine("x".repeat(99), spec)).toMatch(/max is/));
});
