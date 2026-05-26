"use client";

import type { ProductCardProduct } from "@/src/app/components/ProductCard";

export interface ProductLinksState {
  upsell: ProductCardProduct[];
  crosssell: ProductCardProduct[];
  related: ProductCardProduct[];
}

export const _linksCache: Record<string, ProductLinksState> = {};
export const _linksInflight: Record<string, Promise<ProductLinksState>> = {};

export function prefetchProductLinks(urlKey: string): Promise<ProductLinksState> {
  if (urlKey in _linksCache) return Promise.resolve(_linksCache[urlKey]);
  if (urlKey in _linksInflight) return _linksInflight[urlKey];
  const p = fetch(`/api/product-links?urlKey=${encodeURIComponent(urlKey)}`)
    .then((r) => r.json())
    .then((data) => {
      const result: ProductLinksState = {
        upsell: data.upsell ?? [],
        crosssell: data.crosssell ?? [],
        related: data.related ?? [],
      };
      _linksCache[urlKey] = result;
      delete _linksInflight[urlKey];
      return result;
    })
    .catch((): ProductLinksState => {
      delete _linksInflight[urlKey];
      return { upsell: [], crosssell: [], related: [] };
    });
  _linksInflight[urlKey] = p;
  return p;
}
