# Tech
- Next.js (App Router) + TypeScript, deployed on Vercel.
- LLM: Anthropic Claude via tool calling (tools: geocode_place, reverse_geocode, fit_engraving, render_preview, create_checkout).
- Geocoding: Google Maps Geocoding/Places API (fallback: Nominatim).
- Checkout: Shopify Storefront API cart -> checkoutUrl (fallback: PayPal sandbox).
- Tests: Vitest + fast-check property-based tests for engraving rules.
- Secrets in env vars only; never commit keys.
