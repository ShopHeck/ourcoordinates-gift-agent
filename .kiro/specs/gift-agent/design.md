# Design
Chat UI (left) + live product card (right / bottom sheet on mobile).
Agent loop: Claude with tools
- geocode_place(query) -> candidates[]
- fit_engraving(lat, lng, productId, extraLines[]) -> {lines[], precision, accuracy_m, ok}
- render_preview(productId, lines[]) -> SVG
- create_checkout(variantId, properties) -> checkoutUrl
State machine: DESCRIBE -> CANDIDATES -> CONFIRMED -> PRODUCT -> PREVIEW -> CHECKOUT.
Product catalog: JSON (id, name, variants, maxLines, maxCharsPerLine, allowedChars, format).
Preview: SVG template per product, text on a path, engraved-style font.
