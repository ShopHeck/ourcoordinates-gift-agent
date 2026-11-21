// Minimal Anthropic Messages API client (no SDK dependency).
export const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5";

export async function createMessage(body: Record<string, unknown>, fetchImpl: typeof fetch = fetch) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set");
  const r = await fetchImpl("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: MODEL, max_tokens: 1024, ...body }),
  });
  if (!r.ok) throw new Error(`Anthropic ${r.status}: ${await r.text()}`);
  return r.json() as Promise<any>;
}
