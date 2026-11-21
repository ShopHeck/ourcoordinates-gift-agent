# Requirements

## R1 Place discovery
As a gift buyer, I describe a place in natural language so the agent finds it.
- WHEN the customer describes a place THE SYSTEM SHALL return up to 3 candidate places with name, address and coordinates.
- WHEN the description is ambiguous THE SYSTEM SHALL ask one clarifying question.
- THE SYSTEM SHALL never engrave coordinates the customer has not confirmed.

## R2 Confirmation
- WHEN candidates are found THE SYSTEM SHALL show each on a map pin with a Confirm button.
- WHEN the customer drops/moves a pin THE SYSTEM SHALL use the pin's coordinates.

## R3 Engraving fit
- THE SYSTEM SHALL format coordinates as DMS (40°44'54.4"N 73°59'08.4"W) or decimal per product.
- WHEN the formatted text exceeds the product's line/character limit THE SYSTEM SHALL reduce precision (min 4 decimals / 1 decimal-second) and report the accuracy in meters.
- WHEN a custom line (name/date) is added THE SYSTEM SHALL validate allowed characters and length per product.

## R4 Live preview
- WHEN engraving text changes THE SYSTEM SHALL re-render the product preview within 500 ms.

## R5 Checkout
- WHEN the customer approves the preview THE SYSTEM SHALL create a cart with the product variant and engraving as line-item properties and return a checkout URL.

## R6 Product picker
- THE SYSTEM SHALL suggest 1-3 products (bracelet, necklace, ring, keychain) based on recipient and budget.
