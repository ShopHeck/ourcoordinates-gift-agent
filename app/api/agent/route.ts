import { NextResponse } from "next/server";
import { runAgent } from "@/lib/agent/loop";
import { initialState, type AgentState } from "@/lib/agent/state";

export async function POST(req: Request) {
  const body = await req.json();
  let state: AgentState = body.state ?? initialState;
  const messages = body.messages ?? [];
  // Customer tapped Confirm on a candidate (R1/R2): only the UI can set this.
  if (body.confirm) {
    const { name, lat, lng } = body.confirm;
    state = { ...state, stage: "CONFIRMED", confirmed: { name, lat: Number(lat), lng: Number(lng) } };
    messages.push({ role: "user", content: `I confirm: ${name} (${lat}, ${lng}).` });
  } else if (body.text) {
    messages.push({ role: "user", content: String(body.text) });
  }
  try {
    const out = await runAgent(messages, state);
    return NextResponse.json(out);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
