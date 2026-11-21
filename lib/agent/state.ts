// Conversation state machine (design.md). Pure.
export type Stage = "DESCRIBE" | "CANDIDATES" | "CONFIRMED" | "PRODUCT" | "PREVIEW" | "CHECKOUT";

export interface AgentState {
  stage: Stage;
  candidates: { name: string; address: string; lat: number; lng: number }[];
  confirmed?: { name: string; lat: number; lng: number };
  productId?: string;
  lines?: string[];
}

export const initialState: AgentState = { stage: "DESCRIBE", candidates: [] };

const ORDER: Stage[] = ["DESCRIBE", "CANDIDATES", "CONFIRMED", "PRODUCT", "PREVIEW", "CHECKOUT"];

/** Tools allowed at each stage. Engraving tools stay locked until the customer confirms a place (R1). */
export function allowedTools(stage: Stage): string[] {
  const i = ORDER.indexOf(stage);
  const t = ["geocode_place"];
  if (i >= ORDER.indexOf("CONFIRMED")) t.push("reverse_geocode", "fit_engraving", "render_preview");
  if (i >= ORDER.indexOf("PREVIEW")) t.push("create_checkout");
  return t;
}

export function canEngrave(s: AgentState): boolean {
  return !!s.confirmed && ORDER.indexOf(s.stage) >= ORDER.indexOf("CONFIRMED");
}
