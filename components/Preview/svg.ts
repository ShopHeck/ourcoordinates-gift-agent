// Server-safe SVG preview (R4). Pure string render, fast enough to re-render on every keystroke.
import type { Product } from "../../lib/catalog";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export function renderPreviewSVG(p: Product, lines: string[]): string {
  const W = 400, H = p.type === "ring" ? 160 : 120 + lines.length * 28;
  const metal = `<linearGradient id="m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3e3b5"/><stop offset=".5" stop-color="#c9a85a"/><stop offset="1" stop-color="#f6e7bd"/></linearGradient>`;
  const text = lines.map((l, i) =>
    `<text x="${W / 2}" y="${(H - lines.length * 28) / 2 + 22 + i * 28}" text-anchor="middle" font-family="'Courier New', monospace" font-size="20" letter-spacing="1" fill="#5a4618" opacity=".85">${esc(l)}</text>`).join("");
  const shape = p.type === "ring"
    ? `<ellipse cx="${W / 2}" cy="${H / 2}" rx="190" ry="60" fill="none" stroke="url(#m)" stroke-width="40"/>`
    : `<rect x="10" y="10" width="${W - 20}" height="${H - 20}" rx="${p.type === "keychain" ? 24 : 10}" fill="url(#m)"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(p.name)} preview"><defs>${metal}</defs>${shape}${text}</svg>`;
}
