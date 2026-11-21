import { NextResponse } from "next/server";
import { geocodePlace } from "@/lib/geo/geocode";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  if (!q.trim()) return NextResponse.json({ error: "Missing q" }, { status: 400 });
  try {
    const candidates = await geocodePlace(q);
    return NextResponse.json({ candidates });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Geocode failed" }, { status: 502 });
  }
}
