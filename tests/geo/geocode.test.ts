import { describe, it, expect, beforeEach } from "vitest";
import { geocodePlace, dedupe } from "@/lib/geo/geocode";

beforeEach(() => { delete process.env.GOOGLE_MAPS_API_KEY; });

const fakeFetch = (body: unknown) => (async () => new Response(JSON.stringify(body), { status: 200 })) as typeof fetch;

describe("geocodePlace (nominatim)", () => {
  it("maps results and caps at 3", async () => {
    const rows = Array.from({ length: 5 }, (_, i) => ({ name: `P${i}`, display_name: `P${i}, Town`, lat: `${27 + i}`, lon: "-82.8" }));
    const r = await geocodePlace("pier", { fetchImpl: fakeFetch(rows) });
    expect(r).toHaveLength(3);
    expect(r[0]).toMatchObject({ name: "P0", lat: 27, lng: -82.8, source: "nominatim" });
  });
  it("returns nothing for a blank query", async () => {
    expect(await geocodePlace("   ")).toEqual([]);
  });
});

describe("dedupe", () => {
  it("drops points within ~25 m", () => {
    const a = { name: "a", address: "", lat: 27.9, lng: -82.8, source: "nominatim" as const };
    expect(dedupe([a, { ...a, name: "b", lat: 27.90001 }])).toHaveLength(1);
  });
});
