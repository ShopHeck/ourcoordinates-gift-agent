import { describe, it, expect } from "vitest";
import { getProduct } from "@/lib/catalog";
import { lineItemProperties, cartAddFields } from "@/lib/checkout";
import { fitEngraving } from "@/lib/engraving/fit";

const pier = { name: "Pier 60", lat: 27.977512, lng: -82.827901 };

describe("checkout properties", () => {
  it("single-line products match the store's engraving format", () => {
    const p = getProduct("flat-bar-necklace")!;
    const fit = fitEngraving(pier.lat, pier.lng, p.engraving);
    const props = lineItemProperties(p, fit.lines, pier);
    expect(props.Engraving).toBe("27.977512° N, 82.827901° W");
    expect(props["_Place Searched"]).toBe("Pier 60");
  });
  it("rings drop precision to fit 25 characters", () => {
    const p = getProduct("ring-womens")!;
    const fit = fitEngraving(pier.lat, pier.lng, p.engraving);
    expect(fit.ok).toBe(true);
    expect(fit.lines[0].length).toBeLessThanOrEqual(25);
  });
  it("dog tag spreads lines across its three fields", () => {
    const p = getProduct("dog-tag")!;
    const fit = fitEngraving(pier.lat, pier.lng, p.engraving, ["Mike & Ana"]);
    const props = lineItemProperties(p, fit.lines, pier);
    expect(props["Engraving — Line 3"]).toBe("Mike & Ana");
  });
  it("builds cart/add fields that return to checkout", () => {
    const f = cartAddFields("123", { Engraving: "x" });
    expect(f).toContainEqual(["return_to", "/checkout"]);
    expect(f).toContainEqual(["properties[Engraving]", "x"]);
  });
});
