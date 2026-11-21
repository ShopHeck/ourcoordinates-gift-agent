import data from "./products.json";
import type { EngravingSpec } from "../engraving/types";

export interface Product { id: string; name: string; type: string; engraving: EngravingSpec }
export const products: Product[] = data.products as Product[];
export function getProduct(id: string): Product | undefined { return products.find((p) => p.id === id); }
