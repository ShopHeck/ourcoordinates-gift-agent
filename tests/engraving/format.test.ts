import { describe, it, expect } from "vitest";
import { formatDMS, formatDecimal } from "@/lib/engraving/format";

describe("formatDMS", () => {
  it("formats the Empire State Building like the spec", () => {
    const r = formatDMS(40.748440, -73.985664, 1);
    expect(r.lat).toBe(`40°44'54.4"N`);
    expect(r.lng).toBe(`73°59'08.4"W`);
  });
  it("carries seconds rounding into minutes", () => {
    expect(formatDMS(10.9999999, 0, 1).lat).toBe(`11°00'00.0"N`);
  });
  it("rejects invalid coordinates", () => {
    expect(() => formatDMS(91, 0)).toThrow();
    expect(() => formatDMS(0, 181)).toThrow();
  });
});

describe("formatDecimal", () => {
  it("uses hemispheres", () => {
    expect(formatDecimal(-33.8568, 151.2153, 4)).toEqual({ lat: "33.8568° S", lng: "151.2153° E" });
  });
});
