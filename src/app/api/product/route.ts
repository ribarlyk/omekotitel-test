import { NextRequest, NextResponse } from "next/server";
import { fetchProductDetail } from "@/src/app/utils/graphql/fetchers";

export async function GET(request: NextRequest) {
  const urlKey = request.nextUrl.searchParams.get("urlKey");

  if (!urlKey) {
    return NextResponse.json({ error: "urlKey is required" }, { status: 400 });
  }

  try {
    const data = await fetchProductDetail(urlKey);
    const product = (data.products as { items: unknown[] }).items?.[0] ?? null;

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (err) {
    console.error("/api/product error:", err);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}
