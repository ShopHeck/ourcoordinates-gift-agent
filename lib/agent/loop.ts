import { createMessage } from "./anthropic";
import { SYSTEM_PROMPT } from "./prompt";
import { toolDefs, runTool } from "./tools";
import { allowedTools, type AgentState } from "./state";

export type Msg = { role: "user" | "assistant"; content: any };

/** Runs Claude with tools until it replies in text. Returns new messages, final text, and state. */
export async function runAgent(messages: Msg[], state: AgentState, fetchImpl?: typeof fetch, maxSteps = 6) {
  const convo = [...messages];
  let s = state;
  let preview: string | undefined;
  for (let step = 0; step < maxSteps; step++) {
    const tools = toolDefs.filter((t) => allowedTools(s.stage).includes(t.name));
    const res = await createMessage({ system: SYSTEM_PROMPT, messages: convo, tools }, fetchImpl);
    convo.push({ role: "assistant", content: res.content });
    const uses = (res.content as any[]).filter((c) => c.type === "tool_use");
    if (res.stop_reason !== "tool_use" || uses.length === 0) {
      const text = (res.content as any[]).filter((c) => c.type === "text").map((c) => c.text).join("\n");
      return { messages: convo, text, state: s, preview };
    }
    const results = [];
    for (const u of uses) {
      const out: any = await runTool(u.name, u.input, s);
      s = out.state;
      if (out.svg) preview = out.svg;
      results.push({ type: "tool_result", tool_use_id: u.id, content: JSON.stringify(out.result) });
    }
    convo.push({ role: "user", content: results });
  }
  return { messages: convo, text: "Sorry, I got stuck. Could you rephrase that?", state: s, preview };
}
