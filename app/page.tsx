"use client";
import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { fitEngraving } from "@/lib/engraving/fit";
import { products, getProduct } from "@/lib/catalog";
import { renderPreviewSVG } from "@/components/Preview/svg";
import { STORE, lineItemProperties, cartAddFields } from "@/lib/checkout";
import type { AgentState } from "@/lib/agent/state";
import type { Pin } from "@/components/Map/PlaceMap";

const PlaceMap = dynamic(() => import("@/components/Map/PlaceMap"), { ssr: false });

type Bubble = { from: "you" | "agent"; text: string };
const gold = "#b8892e";

export default function Home() {
  const [bubbles, setBubbles] = useState<Bubble[]>([
    { from: "agent", text: "Tell me about a place that matters, like where you met or got engaged. I'll turn it into a piece they'll wear every day." },
  ]);
  const [messages, setMessages] = useState<any[]>([]);
  const [state, setState] = useState<AgentState>({ stage: "DESCRIBE", candidates: [] });
  const [pins, setPins] = useState<Pin[]>([]);
  const [sel, setSel] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [extra, setExtra] = useState("");
  const [busy, setBusy] = useState(false);
  const [variantId, setVariantId] = useState("");

  async function call(body: Record<string, unknown>, show?: string) {
    if (show) setBubbles((b) => [...b, { from: "you", text: show }]);
    setBusy(true);
    try {
      const r = await fetch("/api/agent", { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages, state, ...body }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setMessages(j.messages);
      setState(j.state);
      if (j.state.stage === "CANDIDATES") { setPins(j.state.candidates); setSel(null); }
      if (j.text) setBubbles((b) => [...b, { from: "agent", text: j.text }]);
    } catch (e: any) {
      setBubbles((b) => [...b, { from: "agent", text: `Something went wrong: ${e.message}` }]);
    } finally { setBusy(false); }
  }

  const send = (e: React.FormEvent) => { e.preventDefault(); const t = input.trim(); if (!t || busy) return; setInput(""); call({ text: t }, t); };
  const confirm = () => { if (sel === null) return; const p = pins[sel]; call({ confirm: p }, `That's the one: ${p.name}`); };
  const onSelect = useCallback((i: number) => setSel(i), []);
  const onMove = useCallback((i: number, lat: number, lng: number) => {
    setPins((ps) => ps.map((p, j) => (j === i ? { ...p, lat, lng, name: `${p.name.replace(/ \(adjusted\)$/, "")} (adjusted)` } : p)));
    setSel(i);
  }, []);

  // Live preview (R4): re-fit and re-render locally on every keystroke, no round trip.
  const product = state.productId ? getProduct(state.productId) : undefined;
  const live = useMemo(() => {
    if (!product || !state.confirmed) return null;
    const lines = extra.trim() ? [extra.trim()] : [];
    const fit = fitEngraving(state.confirmed.lat, state.confirmed.lng, product.engraving, lines);
    const props = lineItemProperties(product, fit.lines, state.confirmed);
    return { fit, svg: renderPreviewSVG(product, fit.lines), props };
  }, [product, state.confirmed, extra]);
  const variant = product?.variants.find((v) => v.id === variantId) ?? product?.variants[0];

  return (
    <main style={{ maxWidth: 520, margin: "0 auto", minHeight: "100vh", display: "flex", flexDirection: "column", background: "#faf7f1" }}>
      <header style={{ padding: "16px 20px", borderBottom: "1px solid #eee", fontWeight: 600, letterSpacing: 0.5 }}>
        OurCoordinates <span style={{ color: gold }}>Gift Agent</span>
      </header>

      <section style={{ flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {bubbles.map((b, i) => (
          <div key={i} style={{ alignSelf: b.from === "you" ? "flex-end" : "flex-start", maxWidth: "82%",
            background: b.from === "you" ? gold : "#fff", color: b.from === "you" ? "#fff" : "#222",
            padding: "10px 14px", borderRadius: 16, boxShadow: "0 1px 2px #0001", lineHeight: 1.4 }}>{b.text}</div>
        ))}

        {state.stage === "CANDIDATES" && pins.length > 0 && (
          <div style={{ background: "#fff", borderRadius: 14, padding: 10, boxShadow: "0 1px 3px #0002" }}>
            <PlaceMap pins={pins} selected={sel} onSelect={onSelect} onMove={onMove} />
            <p style={{ fontSize: 12, color: "#777", margin: "8px 4px" }}>Tap a pin, or drag it to the exact spot.</p>
            {pins.map((p, i) => (
              <button key={i} onClick={() => setSel(i)} style={{ display: "block", width: "100%", textAlign: "left", marginTop: 6,
                padding: 10, borderRadius: 10, border: `2px solid ${sel === i ? gold : "#eee"}`, background: "#fff" }}>
                <strong>{p.name}</strong><div style={{ fontSize: 12, color: "#666" }}>{p.address}</div>
              </button>
            ))}
            <button disabled={sel === null || busy} onClick={confirm} style={{ marginTop: 10, width: "100%", padding: 12,
              borderRadius: 10, border: 0, background: sel === null ? "#ccc" : gold, color: "#fff", fontWeight: 600 }}>Confirm this place</button>
          </div>
        )}

        {live && (
          <div style={{ background: "#fff", borderRadius: 14, padding: 14, boxShadow: "0 1px 3px #0002" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
              <img src={product!.image} alt="" width={52} height={52} style={{ borderRadius: 8, objectFit: "cover" }} />
              <div><div style={{ fontWeight: 600 }}>{product!.name}</div><div style={{ fontSize: 13, color: "#666" }}>${variant?.price}</div></div>
            </div>
            <div dangerouslySetInnerHTML={{ __html: live.svg }} />
            <input value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="Add a line (names or a date)"
              style={{ width: "100%", padding: 10, marginTop: 10, borderRadius: 8, border: "1px solid #ddd", boxSizing: "border-box" }} />
            <p style={{ fontSize: 12, color: live.fit.ok ? "#666" : "crimson", marginTop: 6 }}>
              {live.fit.ok ? `Accurate to about ${live.fit.accuracy_m < 1 ? "under a meter" : `${live.fit.accuracy_m.toFixed(0)} m`}` : live.fit.errors.join("; ")}
            </p>
            <select value={product!.id} onChange={(e) => { setVariantId(""); setState((s) => ({ ...s, productId: e.target.value })); }}
              style={{ width: "100%", padding: 8, borderRadius: 8 }}>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {product!.variants.length > 1 && (
              <select value={variant?.id} onChange={(e) => setVariantId(e.target.value)} style={{ width: "100%", padding: 8, borderRadius: 8, marginTop: 6 }}>
                {product!.variants.map((v) => <option key={v.id} value={v.id}>{v.title} · ${v.price}</option>)}
              </select>
            )}
            <form method="POST" action={`${STORE}/cart/add`} style={{ marginTop: 10 }}>
              {variant && cartAddFields(variant.id, live.props).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
              <button disabled={!live.fit.ok} style={{ width: "100%", padding: 12, borderRadius: 10, border: 0,
                background: live.fit.ok ? "#222" : "#ccc", color: "#fff", fontWeight: 600 }}>Checkout on OurCoordinates</button>
            </form>
          </div>
        )}
        {busy && <div style={{ color: "#999", fontSize: 13 }}>Thinking…</div>}
      </section>

      <form onSubmit={send} style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid #eee", position: "sticky", bottom: 0, background: "#faf7f1" }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="The pier where we got engaged…"
          style={{ flex: 1, padding: 12, borderRadius: 22, border: "1px solid #ddd" }} />
        <button disabled={busy} style={{ padding: "0 18px", borderRadius: 22, border: 0, background: gold, color: "#fff", fontWeight: 600 }}>Send</button>
      </form>
    </main>
  );
}
