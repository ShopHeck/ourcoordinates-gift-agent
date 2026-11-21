// Place search + reverse geocode. Google Places when GOOGLE_MAPS_API_KEY is set, else Nominatim. (R1)
import type { PlaceCandidate } from "./types";

const MAX_CANDIDATES = 3;

type Fetch = typeof fetch;

export async function geocodePlace(query: string, opts: { fetchImpl?: Fetch; limit?: number } = {}): Promise<PlaceCandidate[]> {
  const q = query.trim();
  if (!q) return [];
  const limit = Math.min(opts.limit ?? MAX_CANDIDATES, MAX_CANDIDATES);
  const f = opts.fetchImpl ?? fetch;
  const key = process.env.GOOGLE_MAPS_API_KEY;
  const results = key ? await googleTextSearch(q, key, f) : await nominatimSearch(q, f, limit);
  return dedupe(results).slice(0, limit);
}

export async function reverseGeocode(lat: number, lng: number, opts: { fetchImpl?: Fetch } = {}): Promise<PlaceCandidate | null> {
  const f = opts.fetchImpl ?? fetch;
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (key) {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}`;
    const r = await f(url);
    if (!r.ok) throw new Error(`Google reverse geocode ${r.status}`);
    const j: any = await r.json();
    const top = j.results?.[0];
    if (!top) return null;
    return { name: top.formatted_address, address: top.formatted_address, lat, lng, source: "google", placeId: top.place_id };
  }
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
  const r = await f(url, { headers: nominatimHeaders() });
  if (!r.ok) throw new Error(`Nominatim reverse ${r.status}`);
  const j: any = await r.json();
  if (!j?.display_name) return null;
  return { name: j.name || j.display_name.split(",")[0], address: j.display_name, lat, lng, source: "nominatim" };
}

async function googleTextSearch(q: string, key: string, f: Fetch): Promise<PlaceCandidate[]> {
  const r = await f("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location",
    },
    body: JSON.stringify({ textQuery: q, pageSize: MAX_CANDIDATES }),
  });
  if (!r.ok) throw new Error(`Google Places ${r.status}`);
  const j: any = await r.json();
  return (j.places ?? []).map((p: any) => ({
    name: p.displayName?.text ?? p.formattedAddress,
    address: p.formattedAddress,
    lat: p.location.latitude,
    lng: p.location.longitude,
    source: "google" as const,
    placeId: p.id,
  }));
}

async function nominatimSearch(q: string, f: Fetch, limit: number): Promise<PlaceCandidate[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=${limit}&q=${encodeURIComponent(q)}`;
  const r = await f(url, { headers: nominatimHeaders() });
  if (!r.ok) throw new Error(`Nominatim ${r.status}`);
  const j: any[] = await r.json();
  return j.map((p) => ({
    name: p.name || String(p.display_name).split(",")[0],
    address: p.display_name,
    lat: Number(p.lat),
    lng: Number(p.lon),
    source: "nominatim" as const,
  }));
}

function nominatimHeaders() {
  return { "User-Agent": process.env.NOMINATIM_USER_AGENT ?? "ourcoordinates-gift-agent/0.1", "Accept-Language": "en" };
}

/** Drop near-duplicates (same spot within ~25 m). */
export function dedupe(c: PlaceCandidate[]): PlaceCandidate[] {
  const out: PlaceCandidate[] = [];
  for (const p of c) {
    if (!out.some((o) => Math.abs(o.lat - p.lat) < 0.00025 && Math.abs(o.lng - p.lng) < 0.00025)) out.push(p);
  }
  return out;
}
