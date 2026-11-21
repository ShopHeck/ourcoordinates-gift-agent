import { geocodePlace } from "../geo/geocode";
import { fitEngraving } from "../engraving/fit";
import { getProduct, products } from "../catalog";
import { renderPreviewSVG } from "../../components/Preview/svg";
import type { AgentState } from "./state";

export const toolDefs = [
  { name: "geocode_place", description: "Find up to 3 real places matching the customer's description. Never invent coordinates.",
    input_schema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
  { name: "fit_engraving", description: "Fit the CONFIRMED coordinates plus optional custom lines to a product's engraving limits.",
    input_schema: { type: "object", properties: {
      productId: { type: "string", enum: products.map((p) => p.id) },
      extraLines: { type: "array", items: { type: "string" } } }, required: ["productId"] } },
  { name: "render_preview", description: "Show the customer a preview of the engraved piece.",
    input_schema: { type: "object", properties: { productId: { type: "string" }, lines: { type: "array", items: { type: "string" } } },
      required: ["productId", "lines"] } },
];

export async function runTool(name: string, input: any, state: AgentState): Promise<{ result: unknown; state: AgentState }> {
  switch (name) {
    case "geocode_place": {
      const candidates = await geocodePlace(String(input.query ?? ""));
      return { result: { candidates }, state: { ...state, stage: candidates.length ? "CANDIDATES" : "DESCRIBE", candidates, confirmed: undefined } };
    }
    case "fit_engraving": {
      if (!state.confirmed) return { result: { error: "Customer has not confirmed a place yet. Ask them to confirm one." }, state };
      const p = getProduct(input.productId);
      if (!p) return { result: { error: `Unknown product ${input.productId}` }, state };
      const fit = fitEngraving(state.confirmed.lat, state.confirmed.lng, p.engraving, input.extraLines ?? []);
      return { result: fit, state: { ...state, stage: "PRODUCT", productId: p.id, lines: fit.lines } };
    }
    case "render_preview": {
      if (!state.confirmed) return { result: { error: "No confirmed place." }, state };
      const p = getProduct(input.productId);
      if (!p) return { result: { error: `Unknown product ${input.productId}` }, state };
      const svg = renderPreviewSVG(p, input.lines ?? []);
      return { result: { rendered: true }, state: { ...state, stage: "PREVIEW", productId: p.id, lines: input.lines, } , ...( { svg } as any) };
    }
    default:
      return { result: { error: `Unknown tool ${name}` }, state };
  }
}
