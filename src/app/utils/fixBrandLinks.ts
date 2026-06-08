/**
 * Fixes brand links in HTML descriptions.
 * Magento descriptions reference OLD brand slugs (e.g. /marki-brands/hygienfresh.html),
 * but the live categories now use a "-produkti" suffix (url_key: hygienfresh-produkti,
 * url_path: marki-brands/hygienfresh-produkti). This rewrites the old links to the live url_path.
 */

function findBrandUrl(brandUrlMap: Record<string, string>, slug: string): string | undefined {
  const key = slug.toLowerCase();

  // 1. Exact match (covers brands with no suffix change, e.g. astonish, cuki)
  if (brandUrlMap[key]) return brandUrlMap[key];

  // 2. The dominant pattern: old slug + "-produkti"
  if (brandUrlMap[`${key}-produkti`]) return brandUrlMap[`${key}-produkti`];

  // 3. Prefix scan for irregular suffixes (e.g. fresh-and-passion -> fresh-and-passion-car-perfumes).
  //    Pick the shortest matching key to avoid grabbing an unrelated longer brand.
  let best: string | undefined;
  for (const mapKey of Object.keys(brandUrlMap)) {
    if (mapKey.startsWith(`${key}-`) && (!best || mapKey.length < best.length)) {
      best = mapKey;
    }
  }
  return best ? brandUrlMap[best] : undefined;
}

export function fixBrandLinks(html: string, brandUrlMap: Record<string, string>): string {
  if (!html) return html;

  // Handles both relative (/marki-brands/slug) and absolute (https://domain/marki-brands/slug.html?params) URLs
  return html.replace(
    /<a\s+([^>]*\s+)?href=["'](?:https?:\/\/[^/"']*)?\/(?:marki-brands|marki)\/([^"'\s?#]+?)(?:\.html)?(?:[?#][^"']*)?["']([^>]*)>/gi,
    (_match, before = '', slug, after = '') => {
      const correctUrl = findBrandUrl(brandUrlMap, slug);
      if (correctUrl) {
        return `<a ${before}href="/${correctUrl}"${after}>`;
      }
      // Not found — at least keep it on the same host (strip domain + bad query params)
      return `<a ${before}href="/marki-brands/${slug}"${after}>`;
    }
  );
}

export function buildBrandUrlMap(brands: Array<{ url_key: string | null; url_path: string | null }>): Record<string, string> {
  const map: Record<string, string> = {};
  for (const brand of brands) {
    if (brand.url_key && brand.url_path) {
      map[brand.url_key.toLowerCase()] = brand.url_path;
    }
  }
  return map;
}
