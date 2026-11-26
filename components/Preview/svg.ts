// Server-safe SVG preview (R4). Pure string render, fast enough to re-render on every keystroke.
// Each product type gets a shape that matches how the real piece is engraved:
//  - rings: text runs around the OUTSIDE of the band, seen in 3/4 view
//  - dog tag: vertical tag hanging from its jump ring, lines stacked
//  - bar necklace / keychain / bracelet: horizontal bar
// The metal follows the selected variant (silver, gold, rose gold, black).
import type { Product } from "../../lib/catalog";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export type Metal = "gold" | "rose" | "silver" | "black";

interface Palette { light: string; mid: string; dark: string; ink: string }
const PALETTES: Record<Metal, Palette> = {
  gold:   { light: "#f6e7bd", mid: "#c9a85a", dark: "#8f7232", ink: "#4e3c12" },
  rose:   { light: "#f7d9cc", mid: "#d49a86", dark: "#9c6352", ink: "#5a3227" },
  silver: { light: "#f4f5f7", mid: "#b9bdc4", dark: "#7c828b", ink: "#33373d" },
  black:  { light: "#5a5d63", mid: "#2b2d31", dark: "#111214", ink: "#d9dce1" },
};

/** Pick the metal from a Shopify variant title like "6 / Gold" or "Without back engraving / 18K Rose Gold Plated". */
export function metalFromVariant(title?: string): Metal {
  const t = (title ?? "").toLowerCase();
  if (t.includes("rose")) return "rose";
  if (t.includes("black")) return "black";
  if (t.includes("silver") || t.includes("steel")) return "silver";
  if (t.includes("gold")) return "gold";
  return "silver";
}

const MONO = `font-family="'Courier New', Courier, monospace"`;
/** Monospace glyphs are ~0.6em wide; pick the largest size (capped) that fits `width`. */
const fitSize = (lines: string[], width: number, max: number) => {
  const n = Math.max(1, ...lines.map((l) => l.length));
  return Math.max(6, Math.min(max, width / (n * 0.62)));
};

function gradients(pal: Palette) {
  return `<linearGradient id="m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${pal.light}"/><stop offset=".5" stop-color="${pal.mid}"/><stop offset="1" stop-color="${pal.light}"/></linearGradient>` +
    `<linearGradient id="band" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${pal.dark}"/><stop offset=".2" stop-color="${pal.mid}"/><stop offset=".45" stop-color="${pal.light}"/><stop offset=".7" stop-color="${pal.mid}"/><stop offset="1" stop-color="${pal.dark}"/></linearGradient>` +
    `<linearGradient id="inner" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${pal.dark}"/><stop offset="1" stop-color="${pal.mid}"/></linearGradient>`;
}

function ring(p: Product, lines: string[], pal: Palette): string {
  const W = 400, H = 240, cx = 200, rx = 158, ry = 64, top = 82, band = 50;
  const text = lines.join("  ·  ");
  const size = fitSize([text], 270, 17);
  const mid = top + band / 2 + 4;
  // Front face of the band: top rim's front arc, down the sides, bottom rim's front arc back.
  const face = `M${cx - rx},${top} A${rx},${ry} 0 0 0 ${cx + rx},${top} L${cx + rx},${top + band} A${rx},${ry} 0 0 1 ${cx - rx},${top + band} Z`;
  const arc = `M${cx - rx},${mid} A${rx},${ry} 0 0 0 ${cx + rx},${mid}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(p.name)} preview"><defs>${gradients(pal)}<path id="arc" d="${arc}"/></defs>` +
    // inside of the back half of the band, then the hole
    `<ellipse cx="${cx}" cy="${top}" rx="${rx}" ry="${ry}" fill="url(#inner)"/>` +
    `<ellipse cx="${cx}" cy="${top + 7}" rx="${rx - 9}" ry="${ry - 7}" fill="#ffffff"/>` +
    `<path d="${face}" fill="url(#band)"/>` +
    `<path d="M${cx - rx},${top} A${rx},${ry} 0 0 0 ${cx + rx},${top}" fill="none" stroke="${pal.light}" stroke-width="1.5" opacity=".8"/>` +
    (text ? `<text ${MONO} font-size="${size.toFixed(1)}" letter-spacing=".5" fill="${pal.ink}" opacity=".85"><textPath href="#arc" startOffset="50%" text-anchor="middle" dominant-baseline="middle">${esc(text)}</textPath></text>` : "") +
    `</svg>`;
}

function dogTag(p: Product, lines: string[], pal: Palette): string {
  const W = 240, H = 380, x = 45, y = 40, w = 150, h = 310;
  const size = fitSize(lines, w - 26, 15);
  const lh = size * 1.6, start = y + h / 2 + 12 - ((lines.length - 1) * lh) / 2;
  const text = lines.map((l, i) =>
    `<text x="${W / 2}" y="${(start + i * lh).toFixed(1)}" text-anchor="middle" dominant-baseline="middle" ${MONO} font-size="${size.toFixed(1)}" letter-spacing=".5" fill="${pal.ink}" opacity=".85">${esc(l)}</text>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;margin:0 auto;width:100%;max-height:340px" role="img" aria-label="${esc(p.name)} preview"><defs>${gradients(pal)}</defs>` +
    `<circle cx="${W / 2}" cy="${y - 6}" r="13" fill="none" stroke="${pal.mid}" stroke-width="4"/>` +
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="26" fill="url(#m)"/>` +
    `<rect x="${x + 6}" y="${y + 6}" width="${w - 12}" height="${h - 12}" rx="21" fill="none" stroke="${pal.dark}" stroke-width="1" opacity=".35"/>` +
    `<circle cx="${W / 2}" cy="${y + 22}" r="7" fill="#ffffff" stroke="${pal.dark}" stroke-width="1" opacity=".9"/>` +
    text + `</svg>`;
}

function bar(p: Product, lines: string[], pal: Palette): string {
  const W = 400, H = 120 + Math.max(0, lines.length - 1) * 28;
  const size = fitSize(lines, W - 60, 20);
  const lh = size * 1.5, start = H / 2 - ((lines.length - 1) * lh) / 2;
  const text = lines.map((l, i) =>
    `<text x="${W / 2}" y="${(start + i * lh).toFixed(1)}" text-anchor="middle" dominant-baseline="middle" ${MONO} font-size="${size.toFixed(1)}" letter-spacing="1" fill="${pal.ink}" opacity=".85">${esc(l)}</text>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(p.name)} preview"><defs>${gradients(pal)}</defs>` +
    `<rect x="10" y="10" width="${W - 20}" height="${H - 20}" rx="${p.type === "keychain" ? 24 : 10}" fill="url(#m)"/>` + text + `</svg>`;
}

export function renderPreviewSVG(p: Product, lines: string[], variantTitle?: string): string {
  const pal = PALETTES[metalFromVariant(variantTitle ?? p.variants[0]?.title)];
  if (p.type === "ring") return ring(p, lines, pal);
  if (p.id === "dog-tag") return dogTag(p, lines, pal);
  return bar(p, lines, pal);
}
