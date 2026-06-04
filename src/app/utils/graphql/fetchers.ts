import { print } from "graphql";
import { Queries } from ".";

const GRAPHQL_ENDPOINT = process.env.GRAPHQL_URL ?? "";
const REST_BASE = GRAPHQL_ENDPOINT.replace(/\/graphql$/, "/rest/V1");

// Module-level admin token cache — shared across requests in the same process.
let adminTokenCache: { token: string; expiresAt: number } | null = null;

async function getMagentoAdminToken(): Promise<string> {
  if (adminTokenCache && Date.now() < adminTokenCache.expiresAt) {
    return adminTokenCache.token;
  }
  const res = await fetch(`${REST_BASE}/integration/admin/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: process.env.MAGENTO_ADMIN_USER,
      password: process.env.MAGENTO_ADMIN_PASSWORD,
    }),
    // Cache token in Next.js Data Cache for 3 h — avoids marking pages as dynamic.
    next: { revalidate: 10800 },
  });
  if (!res.ok) throw new Error(`Magento admin token fetch failed: ${res.status}`);
  const token: string = await res.json();
  adminTokenCache = { token, expiresAt: Date.now() + 3 * 60 * 60 * 1000 };
  return token;
}

// Abort slow Magento requests before they stall ISR workers.
// Use a longer timeout during static build (many concurrent requests flood Magento).
const FETCH_TIMEOUT_MS =
  process.env.NEXT_PHASE === "phase-production-build" ? 20000 : 10000;

interface CacheOptions {
  revalidate?: number | false;
  tags?: string[];
}

// gql() now throws on every failure mode instead of returning null.
// This means:
//   - Vercel persistent Data Cache never stores a failed/empty result.
//   - ISR revalidations that fail automatically keep the previous good HTML.
//   - The first-ever request during a Magento outage gets a 500 (correct —
//     better than silently caching an empty page).
async function gql<T>(
  query: ReturnType<typeof print>,
  variables?: Record<string, unknown>,
  cacheOptions?: CacheOptions,
): Promise<T> {
  if (!GRAPHQL_ENDPOINT) throw new Error("GRAPHQL_URL is not configured");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
      ...(cacheOptions ? { next: cacheOptions } : { cache: "no-store" }),
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timeout);
    if (e instanceof Error && e.name === "AbortError") throw e;
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`GraphQL network error: ${msg}`);
  }
  clearTimeout(timeout);

  if (!res.ok) {
    throw new Error(`GraphQL HTTP ${res.status} from Magento`);
  }

  const json = await res.json();

  if (!json.data) {
    // No data at all — fatal, throw so ISR keeps the previous good page.
    const detail = json.errors ? JSON.stringify(json.errors) : "empty response";
    throw new Error(`GraphQL returned no data: ${detail}`);
  }

  if (json.errors) {
    // Partial success: Magento returned data alongside field-level errors
    // (e.g. price_range internal errors on specific products). Log for
    // observability but do not throw — the page can render with null fields,
    // and throwing here would break builds / ISR for permanent Magento data issues.
    console.warn("GraphQL partial errors:", JSON.stringify(json.errors));
  }

  return json.data as T;
}


export async function fetchCatalog() {
  const data = await gql<{ categoryList: unknown[] }>(
    print(Queries.GET_CATALOG),
    undefined,
    // Coarse tag — invalidate all nav when catalog structure changes.
    { revalidate: false, tags: ["catalog"] },
  );
  if (!data.categoryList?.length) {
    throw new Error("fetchCatalog: Magento returned an empty categoryList");
  }
  return data;
}

export type MagentoFilterValue =
  | { eq: string }
  | { in: string[] }
  | { from: string; to: string };

export async function fetchProductsByCategory(
  categoryId: string,
  pageSize = 20,
  currentPage = 1,
  extraFilters: Record<string, MagentoFilterValue> = {},
) {
  const filter = { category_id: { eq: categoryId }, ...extraFilters };
  return gql<{ products: { items: unknown[]; total_count: number; aggregations: unknown[] } }>(
    print(Queries.GET_PRODUCTS_BY_CATEGORY),
    { filter, pageSize, currentPage, sort: { position: "ASC" } },
    { revalidate: false, tags: ["products", `products:category:${categoryId}`] },
  );
}

export async function fetchProductDetail(urlKey: string) {
  // Next.js does not decode non-ASCII percent-encoded path segments in params —
  // decode for the GraphQL variable (Magento needs actual Cyrillic text).
  // Keep the original percent-encoded form for the cache tag — HTTP headers are ASCII-only.
  const decoded = decodeURIComponent(urlKey);
  const productTag = `product:${urlKey}`;
  const tags = productTag.length <= 256 ? ["products", productTag] : ["products"];
  return gql<{ products: { items: unknown[] } }>(
    print(Queries.GET_PRODUCT_DETAIL),
    { urlKey: decoded },
    { revalidate: false, tags },
  );
}

export async function fetchAttributeMetadata() {
  const data = await gql<{
    customAttributeMetadata: {
      items: { attribute_code: string; attribute_options: { label: string; value: string }[] | null }[];
    };
  }>(
    print(Queries.GET_ATTRIBUTE_METADATA),
    undefined,
    // Attribute options change rarely — cache for 24 h.
    { revalidate: 86400, tags: ["attribute-metadata"] },
  );
  return data.customAttributeMetadata.items;
}

// Fetch upsell + crosssell SKUs via REST (GraphQL resolvers are broken for these on this instance).
// Uses the products search API with url_key — avoids SKU encoding issues with special characters.
export async function fetchProductLinkSkus(
  urlKey: string,
): Promise<{ upsell: string[]; crosssell: string[]; related: string[] }> {
  try {
    const token = await getMagentoAdminToken();
    const params = new URLSearchParams({
      "searchCriteria[filterGroups][0][filters][0][field]": "url_key",
      "searchCriteria[filterGroups][0][filters][0][value]": urlKey,
      "fields": "items[product_links]",
    });
    const res = await fetch(`${REST_BASE}/products?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return { upsell: [], crosssell: [], related: [] };

    type LinkItem = { link_type: string; linked_product_sku: string; position: number };
    const data: { items: { product_links?: LinkItem[] }[] } = await res.json();
    const links = data.items?.[0]?.product_links ?? [];

    const byPosition = (a: LinkItem, b: LinkItem) => a.position - b.position;
    return {
      upsell: links.filter((l) => l.link_type === "upsell").sort(byPosition).map((l) => l.linked_product_sku),
      crosssell: links.filter((l) => l.link_type === "crosssell").sort(byPosition).map((l) => l.linked_product_sku),
      related: links.filter((l) => l.link_type === "related").sort(byPosition).map((l) => l.linked_product_sku),
    };
  } catch (e) {
    console.warn("fetchProductLinkSkus failed:", e);
    return { upsell: [], crosssell: [], related: [] };
  }
}

export async function fetchProductsBySku(skus: string[]) {
  if (!skus.length) return [];
  const data = await gql<{ products: { items: unknown[] } }>(
    print(Queries.GET_PRODUCTS_BY_SKU),
    { skus },
  );
  return (data.products?.items ?? []) as import("@/src/app/components/ProductCard").ProductCardProduct[];
}

export async function fetchAllProductUrlKeys(): Promise<string[]> {
  const catalog = await fetchCatalog();
  const rootId = (catalog.categoryList[0] as { id: number }).id;
  const PAGE_SIZE = 200;
  const urlKeys = new Set<string>();
  let page = 1;
  let totalPages = 1;
  do {
    const data = await gql<{
      products: { items: { url_key: string }[]; page_info: { total_pages: number } };
    }>(
      print(Queries.GET_PRODUCTS_SITEMAP),
      { filter: { category_id: { eq: String(rootId) } }, pageSize: PAGE_SIZE, currentPage: page },
      { revalidate: 3600, tags: ["sitemap-products"] },
    );
    for (const item of data.products.items) {
      if (item.url_key) urlKeys.add(item.url_key);
    }
    totalPages = data.products.page_info.total_pages;
    page++;
  } while (page <= totalPages);
  return [...urlKeys];
}

// Search is intentionally uncached — results must reflect live inventory.
export async function fetchSearchProducts(search: string, pageSize = 20) {
  return gql<{ products: { items: unknown[]; total_count: number; aggregations: unknown[] } }>(
    print(Queries.SEARCH_PRODUCTS),
    { search, pageSize, sort: { name: "ASC" } },
  );
}
