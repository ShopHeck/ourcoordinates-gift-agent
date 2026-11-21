// Checkout handoff (R5): OurCoordinates' own Shopify cart/add, with engraving as line-item properties.
import type { Product } from "../catalog";

export const STORE = "https://ourcoordinates.com";

export function lineItemProperties(p: Product, lines: string[], place: { name: string; lat: number; lng: number }) {
  const props: Record<string, string> = {};
  if (p.fields.length === 1) props[p.fields[0]] = lines.join(" ");
  else p.fields.forEach((f, i) => { if (lines[i]) props[f] = lines[i]; });
  props["_Exact Decimal Coordinates"] = `${place.lat.toFixed(6)}, ${place.lng.toFixed(6)}`;
  props["_Place Searched"] = place.name;
  props["_Verify on Map"] = `https://www.google.com/maps/search/?api=1&query=${place.lat.toFixed(6)},${place.lng.toFixed(6)}`;
  return props;
}

/** Fields for a form POST to {STORE}/cart/add that lands the buyer on checkout with the engraving attached. */
export function cartAddFields(variantId: string, props: Record<string, string>) {
  const f: [string, string][] = [["id", variantId], ["quantity", "1"], ["return_to", "/checkout"]];
  for (const [k, v] of Object.entries(props)) f.push([`properties[${k}]`, v]);
  return f;
}
