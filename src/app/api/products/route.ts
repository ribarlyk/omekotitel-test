import { NextRequest, NextResponse } from "next/server";
import { Queries } from "@/src/app/utils/graphql";
import { print } from "graphql";

const ATTR_CODE_RE = /^[a-z][a-z0-9_]{0,63}$/;
const PRICE_RANGE_RE = /^\d+(\.\d+)?_\d+(\.\d+)?$/;

function buildFilter(categoryId: string, rawFilters: Record<string, string[]>) {
  const filter: Record<string, unknown> = { category_id: { eq: categoryId } };

  for (const [code, values] of Object.entries(rawFilters)) {
    if (!ATTR_CODE_RE.test(code)) continue;
    const safe = values.filter((v) => typeof v === "string" && v.length <= 100);
    if (safe.length === 0) continue;

    if (code === "price") {
      if (!PRICE_RANGE_RE.test(safe[0])) continue;
      const [from, to] = safe[0].split("_");
      filter.price = { from, to };
    } else {
      filter[code] = safe.length === 1 ? { eq: safe[0] } : { in: safe };
    }
  }

  return filter;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get("categoryId");
    const pageSize = Math.min(Math.max(parseInt(searchParams.get("pageSize") || "20") || 20, 1), 100);
    const currentPage = Math.max(parseInt(searchParams.get("currentPage") || "1") || 1, 1);

    if (!categoryId || !/^\d+$/.test(categoryId)) {
      return NextResponse.json({ error: "Invalid categoryId" }, { status: 400 });
    }

    let rawFilters: Record<string, string[]> = {};
    const filtersParam = searchParams.get("filters");
    if (filtersParam) {
      try {
        const parsed = JSON.parse(filtersParam);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          rawFilters = Object.fromEntries(
            Object.entries(parsed as Record<string, unknown>)
              .slice(0, 20)
              .filter(([, v]) => Array.isArray(v))
              .map(([k, v]) => [k, (v as unknown[]).slice(0, 10).filter((x) => typeof x === "string") as string[]])
          );
        }
      } catch {
        // ignore malformed filters
      }
    }

    const GRAPHQL_ENDPOINT = process.env.GRAPHQL_URL ?? "";
    if (!GRAPHQL_ENDPOINT) {
      return NextResponse.json({ error: "GRAPHQL_URL is not configured" }, { status: 500 });
    }

    const VALID_SORT_FIELDS = new Set(["position", "name", "price", "relevance"]);
    const sortField = searchParams.get("sortField") ?? "position";
    const sortDir = searchParams.get("sortDir") === "DESC" ? "DESC" : "ASC";
    const sort = { [VALID_SORT_FIELDS.has(sortField) ? sortField : "position"]: sortDir };

    const filter = buildFilter(categoryId, rawFilters);

    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: print(Queries.GET_PRODUCTS_BY_CATEGORY),
        variables: { filter, pageSize, currentPage, sort },
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Upstream error" }, { status: 502 });
    }

    const data = await response.json();
    if (data.errors) {
      console.error("GraphQL errors:", data.errors);
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 400 });
    }

    return NextResponse.json(data.data);
  } catch (error) {
    console.error("Products API error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
