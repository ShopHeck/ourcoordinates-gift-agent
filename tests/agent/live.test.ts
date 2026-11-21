import { describe, it, expect } from "vitest";
import { runAgent } from "@/lib/agent/loop";
import { initialState } from "@/lib/agent/state";

// Opt-in: LIVE=1 npx vitest run tests/agent/live.test.ts
describe.runIf(process.env.LIVE === "1")("live agent", () => {
  it("finds candidates, then fits + previews after confirm", async () => {
    const a = await runAgent([{ role: "user", content: "Pier 60 in Clearwater Beach, Florida. It's for my girlfriend." }], initialState);
    console.log("TURN1:", a.text, a.state.stage, a.state.candidates.map((c) => c.name));
    expect(a.state.candidates.length).toBeGreaterThan(0);
    const c = a.state.candidates[0];
    const msgs = [...a.messages, { role: "user" as const, content: `I confirm: ${c.name} (${c.lat}, ${c.lng}). A necklace please.` }];
    const b = await runAgent(msgs, { ...a.state, stage: "CONFIRMED", confirmed: { name: c.name, lat: c.lat, lng: c.lng } });
    console.log("TURN2:", b.text, b.state.stage, b.state.lines, !!b.preview);
    expect(b.state.lines?.length).toBeGreaterThan(0);
  }, 90_000);
});
