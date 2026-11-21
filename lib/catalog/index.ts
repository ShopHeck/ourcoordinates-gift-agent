import data from "./products.json";
import type { EngravingSpec } from "../engraving/types";

export interface Variant { id: string; title: string; price: string }
export interface Product {
  id: string; name: string; type: string; handle: string; url: string; image: string; price: string;
  variants: Variant[]; engraving: EngravingSpec;
  /** Shopify line-item property names, one per engraved line, in order. */
  fields: string[];
}
export const products: Product[] = data.products as Product[];
export function getProduct(id: string): Product | undefined { return products.find((p) => p.id === id); }
