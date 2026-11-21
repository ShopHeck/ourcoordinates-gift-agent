"use client";
import { useState } from "react";
import { fitEngraving } from "@/lib/engraving/fit";
import { products } from "@/lib/catalog";

type Candidate = { name: string; address: string; lat: number; lng: number };

export default function Home() {
  const [q, setQ] = useState("");
  const [cands, setCands] = useState<Candidate[]>([]);
  const [picked, setPicked] = useState<Candidate | null>(null);
  const [productId, setProductId] = useState(products[0].id);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr(""); setPicked(null);
    const r = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
    const j = await r.json();
    setLoading(false);
    if (!r.ok) return setErr(j.error);
    setCands(j.candidates);
    if (!j.candidates.length) setErr("No matches. Try adding a city or landmark.");
  }

  const product = products.find((p) => p.id === productId)!;
  const fit = picked ? fitEngraving(picked.lat, picked.lng, product.engraving) : null;

  return (
    <main style={{ maxWidth: 560, margin: "40px auto", padding: 16 }}>
      <h1>Where's your place?</h1>
      <form onSubmit={search} style={{ display: "flex", gap: 8 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="The pier where we got engaged, Clearwater"
          style={{ flex: 1, padding: 10 }} />
        <button disabled={loading}>{loading ? "…" : "Find"}</button>
      </form>
      {err && <p style={{ color: "crimson" }}>{err}</p>}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {cands.map((c) => (
          <li key={`${c.lat},${c.lng}`} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, marginTop: 8 }}>
            <strong>{c.name}</strong><div style={{ fontSize: 13, color: "#555" }}>{c.address}</div>
            <button onClick={() => setPicked(c)} style={{ marginTop: 6 }}>
              {picked === c ? "Confirmed ✓" : "Confirm this place"}
            </button>
          </li>
        ))}
      </ul>
      {fit && (
        <section style={{ marginTop: 24 }}>
          <select value={productId} onChange={(e) => setProductId(e.target.value)}>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <pre style={{ background: "#111", color: "#e8d8a0", padding: 16, borderRadius: 8, fontSize: 16 }}>
            {fit.lines.join("\n")}
          </pre>
          <p style={{ fontSize: 13 }}>Accurate to about {fit.accuracy_m.toFixed(1)} m{fit.ok ? "" : ` · ${fit.errors.join("; ")}`}</p>
        </section>
      )}
    </main>
  );
}
