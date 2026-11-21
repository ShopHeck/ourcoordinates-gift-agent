import { describe, it, expect, beforeEach } from "vitest";
import { runAgent } from "@/lib/agent/loop";
import { initialState, allowedTools } from "@/lib/agent/state";
import { runTool } from "@/lib/agent/tools";

beforeEach(() => { process.env.ANTHROPIC_API_KEY = "test"; delete process.env.GOOGLE_MAPS_API_KEY; });

describe("state gating", () => {
  it("locks engraving tools before confirmation", () => {
    expect(allowedTools("DESCRIBE")).toEqual(["geocode_place"]);
    expect(allowedTools("CANDIDATES")).not.toContain("fit_engraving");
    expect(allowedTools("CONFIRMED")).toContain("fit_engraving");
  });
  it("fit_engraving refuses an unconfirmed place", async () => {
    const r: any = await runTool("fit_engraving", { productId: "bar-bracelet" }, initialState);
    expect(r.result.error).toMatch(/not confirmed/);
  });
});

describe("runAgent", () => {
  it("runs a geocode tool call then returns text", async () => {
    const replies = [
      { stop_reason: "tool_use", content: [{ type: "tool_use", id: "t1", name: "geocode_place", input: { query: "Pier 60 Clearwater" } }] },
      { stop_reason: "end_turn", content: [{ type: "text", text: "Is it this one?" }] },
    ];
    let i = 0;
    const f = (async (url: string) => {
      if (String(url).includes("anthropic")) return new Response(JSON.stringify(replies[i++]));
      return new Response(JSON.stringify([{ name: "Pier 60", display_name: "Pier 60, Clearwater, FL", lat: "27.9775", lon: "-82.8279" }]));
    }) as typeof fetch;
    const geoFetch = globalThis.fetch; globalThis.fetch = f;
    try {
      const out = await runAgent([{ role: "user", content: "the pier in clearwater" }], initialState, f);
      expect(out.text).toBe("Is it this one?");
      expect(out.state.stage).toBe("CANDIDATES");
      expect(out.state.candidates[0].name).toBe("Pier 60");
    } finally { globalThis.fetch = geoFetch; }
  });
});
