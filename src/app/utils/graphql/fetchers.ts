import { print } from "graphql";
import { Queries } from ".";

const GRAPHQL_ENDPOINT = process.env.GRAPHQL_URL ?? "";

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
    console.error("GraphQL partial errors:", json.errors);
  }

  return json.data as T;
}

// Spread revalidations over ±20% of base to prevent thundering herd when many
// pages expire simultaneously after a deploy.
function jitter(base: number, factor = 0.2) {
  const spread = base * factor;
  return Math.round(base - spread / 2 + Math.random() * spread);
}

export async function fetchCatalog() {
  return gql<{ categoryList: unknown[] }>(
    print(Queries.GET_CATALOG),
    undefined,
    // Coarse tag — invalidate all nav when catalog structure changes.
    { revalidate: jitter(3600), tags: ["catalog"] },
  );
}

export async function fetchProductsByCategory(
  categoryId: string,
  pageSize = 20,
  currentPage = 1,
) {
  return gql<{ products: { items: unknown[]; total_count: number } }>(
    print(Queries.GET_PRODUCTS_BY_CATEGORY),
    { categoryId, pageSize, currentPage },
    // Fine-grained tag: invalidate one category without busting all products.
    { revalidate: jitter(3600), tags: ["products", `products:category:${categoryId}`] },
  );
}

export async function fetchProductDetail(urlKey: string) {
  return gql<{ products: { items: unknown[] } }>(
    print(Queries.GET_PRODUCT_DETAIL),
    { urlKey },
    // Fine-grained tag: invalidate one product without busting all products.
    { revalidate: jitter(1800), tags: ["products", `product:${urlKey}`] },
  );
}

// Search is intentionally uncached — results must reflect live inventory.
export async function fetchSearchProducts(search: string, pageSize = 20) {
  return gql<{ products: { items: unknown[]; total_count: number } }>(
    print(Queries.SEARCH_PRODUCTS),
    { search, pageSize },
  );
}
