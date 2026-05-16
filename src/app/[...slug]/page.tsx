import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

import ProductDetail from "@/src/app/components/ProductDetail";
import CategoryPage from "@/src/app/components/CategoryPage";
import { Aggregation } from "@/src/app/components/FilterSidebar";
import {
  fetchCatalog,
  fetchProductsByCategory,
  fetchProductDetail,
  fetchAttributeMetadata,
  fetchProductLinkSkus,
  fetchProductsBySku,
} from "@/src/app/utils/graphql/fetchers";
import {
  buildOptionMap,
  resolveProductAttributes,
} from "@/src/app/utils/productAttributes";

interface Category {
  id: number;
  name: string;
  url_key: string | null;
  url_path: string | null;
  children?: Category[];
}

// Collect all category url_paths from the tree recursively
function collectUrlPaths(list: Category[]): string[] {
  const paths: string[] = [];
  for (const cat of list) {
    if (cat.url_path) paths.push(cat.url_path);
    if (cat.children?.length) paths.push(...collectUrlPaths(cat.children));
  }
  return paths;
}

// Paths that are too large or too dynamic to pre-generate statically
const EXCLUDED_STATIC_PREFIXES = ["marki-brands"];

export async function generateStaticParams() {
  try {
    const catalog = await fetchCatalog();
    if (!catalog) return [];
    const urlPaths = collectUrlPaths(catalog.categoryList as Category[]).filter(
      (p) => !EXCLUDED_STATIC_PREFIXES.some((prefix) => p === prefix || p.startsWith(prefix + "/")),
    );
    return urlPaths.map((urlPath) => ({ slug: urlPath.split("/") }));
  } catch {
    // Magento unavailable at build time — pages will be generated on first visit via ISR
    return [];
  }
}

// Recursively search the tree by url_path (e.g. "parent/child/grandchild")
function findCategoryByUrlPath(
  list: Category[],
  urlPath: string,
): Category | null {
  for (const cat of list) {
    if (cat.url_path === urlPath) return cat;
    if (cat.children?.length) {
      const found = findCategoryByUrlPath(cat.children, urlPath);
      if (found) return found;
    }
  }
  return null;
}

async function PageData({ slugs }: { slugs: string[] }) {
  const urlKey = slugs[slugs.length - 1];

  // Fetch product, catalog, and attribute metadata in parallel
  const [productData, catalog, attrMetaItems] = await Promise.all([
    fetchProductDetail(urlKey),
    fetchCatalog(),
    fetchAttributeMetadata(),
  ]);

  const rawProduct = productData?.products?.items?.[0] as Record<string, unknown> | undefined;
  const product = rawProduct as Parameters<typeof ProductDetail>[0]["product"] | undefined;

  const optionMap = buildOptionMap(attrMetaItems);

  // Single-segment product match (products have no category prefix in url_key)
  if (product && rawProduct && slugs.length === 1) {
    const resolvedAttributes = resolveProductAttributes(rawProduct, optionMap);
    const { upsell: upsellSkus, crosssell: crosssellSkus } = await fetchProductLinkSkus(urlKey);
    const [upsellProducts, crosssellProducts] = await Promise.all([
      fetchProductsBySku(upsellSkus),
      fetchProductsBySku(crosssellSkus),
    ]);
    return (
      <ProductDetail
        product={product}
        resolvedAttributes={resolvedAttributes}
        upsellProducts={upsellProducts}
        crosssellProducts={crosssellProducts}
      />
    );
  }

  // Category match — match against Magento's url_path (e.g. "parent/child")
  if (catalog) {
    const urlPath = slugs.join("/");
    const category = findCategoryByUrlPath(
      catalog.categoryList as Category[],
      urlPath,
    );
    if (category) {
      const data = await fetchProductsByCategory(String(category.id));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const products = (data.products?.items ?? []) as any[];
      const totalCount = data.products?.total_count ?? 0;
      const aggregations = (data.products?.aggregations ?? []) as Aggregation[];

      return (
        <div className="container mx-auto px-4 py-4 lg:py-8">
          <CategoryPage
            categoryId={String(category.id)}
            categoryName={category.name}
            initialProducts={products}
            initialTotalCount={totalCount}
            aggregations={aggregations}
          />
        </div>
      );
    }
  }

  // Multi-segment fallback — could be product under a category path, try last segment
  if (product && rawProduct && slugs.length > 1) {
    const resolvedAttributes = resolveProductAttributes(rawProduct, optionMap);
    const { upsell: upsellSkus, crosssell: crosssellSkus } = await fetchProductLinkSkus(urlKey);
    const [upsellProducts, crosssellProducts] = await Promise.all([
      fetchProductsBySku(upsellSkus),
      fetchProductsBySku(crosssellSkus),
    ]);
    return (
      <ProductDetail
        product={product}
        resolvedAttributes={resolvedAttributes}
        upsellProducts={upsellProducts}
        crosssellProducts={crosssellProducts}
      />
    );
  }

  return notFound();
}

export default async function SlugPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;

  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 flex items-center justify-center">
          <Loader2 className="w-16 h-16 animate-spin text-brand-action" />
        </div>
      }
    >
      <PageData slugs={slug} />
    </Suspense>
  );
}
