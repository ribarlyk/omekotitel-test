import { print } from "graphql";
import { unstable_cache } from "next/cache";
import { Queries } from ".";

const GRAPHQL_ENDPOINT = process.env.GRAPHQL_URL ?? "";

async function gql<T>(
  query: ReturnType<typeof print>,
  variables?: Record<string, unknown>,
): Promise<T | null> {
  if (!GRAPHQL_ENDPOINT) return null;
  try {
    const res = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.errors) {
      console.error("GraphQL errors:", json.errors);
    }
    if (!json.data) return null;
    return json.data as T;
  } catch (e) {
    console.error("GraphQL fetch error:", e);
    return null;
  }
}

// unstable_cache does NOT store the result when the function throws,
// so failed/error responses are never cached — next request retries immediately.

const fetchCatalogCached = unstable_cache(
  async () => {
    const result = await gql<{ categoryList: unknown[] }>(
      print(Queries.GET_CATALOG),
    );
    if (!result) throw new Error("Catalog fetch failed");
    return result;
  },
  ["catalog"],
  { revalidate: 3600, tags: ["catalog"] },
);

export async function fetchCatalog() {
  try {
    return await fetchCatalogCached();
  } catch {
    return null;
  }
}

const fetchProductsByCategoryCached = unstable_cache(
  async (categoryId: string, pageSize: number, currentPage: number) => {
    const result = await gql<{ products: { items: unknown[]; total_count: number } }>(
      print(Queries.GET_PRODUCTS_BY_CATEGORY),
      { categoryId, pageSize, currentPage },
    );
    if (!result) throw new Error("Products fetch failed");
    return result;
  },
  ["products-by-category"],
  { revalidate: 3600, tags: ["products"] },
);

export async function fetchProductsByCategory(
  categoryId: string,
  pageSize = 20,
  currentPage = 1,
) {
  try {
    return await fetchProductsByCategoryCached(categoryId, pageSize, currentPage);
  } catch {
    return null;
  }
}

const fetchProductDetailCached = unstable_cache(
  async (urlKey: string) => {
    const result = await gql<{ products: { items: unknown[] } }>(
      print(Queries.GET_PRODUCT_DETAIL),
      { urlKey },
    );
    if (!result) throw new Error("Product fetch failed");
    return result;
  },
  ["product-detail"],
  { revalidate: 1800, tags: ["products"] },
);

export async function fetchProductDetail(urlKey: string) {
  try {
    return await fetchProductDetailCached(urlKey);
  } catch {
    return null;
  }
}

export async function fetchSearchProducts(search: string, pageSize = 20) {
  return gql<{ products: { items: unknown[]; total_count: number } }>(
    print(Queries.SEARCH_PRODUCTS),
    { search, pageSize },
  );
}
