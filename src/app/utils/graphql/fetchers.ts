import { print } from "graphql";
import { Queries } from ".";

const GRAPHQL_ENDPOINT = process.env.GRAPHQL_URL ?? "";

async function gql<T>(
  query: ReturnType<typeof print>,
  variables?: Record<string, unknown>,
  fetchOptions?: RequestInit
): Promise<T | null> {
  if (!GRAPHQL_ENDPOINT) return null;
  try {
    const res = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
      ...fetchOptions,
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.errors) {
      console.error("GraphQL errors:", json.errors);
      return null;
    }
    return json.data as T;
  } catch (e) {
    console.error("GraphQL fetch error:", e);
    return null;
  }
}

export async function fetchCatalog() {
  return gql<{ categoryList: unknown[] }>(
    print(Queries.GET_CATALOG),
    undefined,
    { next: { revalidate: 3600 } }
  );
}

export async function fetchProductsByCategory(
  categoryId: string,
  pageSize = 20,
  currentPage = 1
) {
  return gql<{ products: { items: unknown[]; total_count: number } }>(
    print(Queries.GET_PRODUCTS_BY_CATEGORY),
    { categoryId, pageSize, currentPage },
    { next: { revalidate: 86400 } }
  );
}

export async function fetchProductDetail(urlKey: string) {
  return gql<{ products: { items: unknown[] } }>(
    print(Queries.GET_PRODUCT_DETAIL),
    { urlKey },
    { next: { revalidate: 86400 } }
  );
}

export async function fetchSearchProducts(search: string, pageSize = 20) {
  return gql<{ products: { items: unknown[]; total_count: number } }>(
    print(Queries.SEARCH_PRODUCTS),
    { search, pageSize },
    { cache: "no-store" }
  );
}
