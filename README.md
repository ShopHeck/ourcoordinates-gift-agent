# OurCoordinates Gift Agent

An AI gift agent for OurCoordinates engraved coordinate jewelry. Tell it a place that matters (where you met, got engaged, grew up), and it finds the coordinates, confirms them with you, checks the engraving fits, shows a preview, and walks you to checkout.

Built for Kiroween 2026 (Frankenstein category) with Kiro.

## Kiro
Specs, steering, and hooks live in [`/.kiro`](.kiro):
- `steering/`: product, tech, and structure guidance
- `specs/gift-agent/`: requirements, design, and tasks
- `hooks/`: engraving-fit test hook

## License
MIT

## Run locally
```bash
npm install
cp .env.example .env.local   # add keys
npm run dev                   # http://localhost:3000
npm test                      # unit + property tests (fast-check)
```
Without `GOOGLE_MAPS_API_KEY`, place search falls back to OpenStreetMap Nominatim.
