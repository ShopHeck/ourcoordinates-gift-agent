import { describe, it, expect } from "vitest";
import { renderPreviewSVG, metalFromVariant } from "../components/Preview/svg";
import { getProduct } from "../lib/catalog";

describe("preview", () => {
  it("reads the metal from the variant title", () => {
    expect(metalFromVariant("6 / Silver")).toBe("silver");
    expect(metalFromVariant("8 / Black")).toBe("black");
    expect(metalFromVariant("Without back engraving / 18K Rose Gold Plated")).toBe("rose");
    expect(metalFromVariant("Without back engraving / Silver Steel")).toBe("silver");
    expect(metalFromVariant("9 / Gold")).toBe("gold");
  });
  it("puts ring text on the outside band, not in the hole", () => {
    const svg = renderPreviewSVG(getProduct("ring-womens")!, ["27.72368° N, 82.74343° W"], "6 / Silver");
    expect(svg).toContain("<textPath");
    expect(svg).toContain("#b9bdc4"); // silver, not gold
    expect(svg).not.toContain("#c9a85a");
  });
  it("draws the dog tag vertically", () => {
    const svg = renderPreviewSVG(getProduct("dog-tag")!, ["27.723683° N", "82.743427° W"], "x / 18K Rose Gold Plated");
    const [, w, h] = svg.match(/viewBox="0 0 (\d+) (\d+)"/)!.map(Number);
    expect(h).toBeGreaterThan(w);
    expect(svg).toContain("#d49a86");
  });
});
