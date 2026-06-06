import { NextRequest, NextResponse } from "next/server";
import { fetchProductLinkSkus, fetchProductsBySku } from "@/src/app/utils/graphql/fetchers";

export async function GET(req: NextRequest) {
  const urlKey = req.nextUrl.searchParams.get("urlKey");
  if (!urlKey) return NextResponse.json({ upsell: [], crosssell: [], related: [] });

  try {
    const { upsell: upsellSkus, crosssell: crosssellSkus, related: relatedSkus } = await fetchProductLinkSkus(urlKey);
    const [upsellProducts, crosssellProducts, relatedProducts] = await Promise.all([
      fetchProductsBySku(upsellSkus),
      fetchProductsBySku(crosssellSkus),
      fetchProductsBySku(relatedSkus),
    ]);

    return NextResponse.json({ upsell: upsellProducts, crosssell: crosssellProducts, related: relatedProducts });
  } catch (e) {
    console.error(`[product-links] urlKey=${urlKey} failed:`, e);
    return NextResponse.json({ upsell: [], crosssell: [], related: [] });
  }
}
