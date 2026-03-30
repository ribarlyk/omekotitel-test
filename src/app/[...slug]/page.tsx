import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

import ProductsList from "@/src/app/components/ProductsList";
import ProductDetail from "@/src/app/components/ProductDetail";
import {
  fetchCatalog,
  fetchProductsByCategory,
  fetchProductDetail,
} from "@/src/app/utils/graphql/fetchers";

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
  const catalog = await fetchCatalog();
  if (!catalog) return [];
  const urlPaths = collectUrlPaths(catalog.categoryList as Category[]).filter(
    (p) => !EXCLUDED_STATIC_PREFIXES.some((prefix) => p === prefix || p.startsWith(prefix + "/")),
  );
  return urlPaths.map((urlPath) => ({ slug: urlPath.split("/") }));
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

  // Fetch product and catalog in parallel
  const [productData, catalog] = await Promise.all([
    fetchProductDetail(urlKey),
    fetchCatalog(),
  ]);

  const product = productData?.products?.items?.[0] as
    | Parameters<typeof ProductDetail>[0]["product"]
    | undefined;

  // Single-segment product match (products have no category prefix in url_key)
  if (product && slugs.length === 1) {
    return <ProductDetail product={product} />;
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
      const products = (data?.products?.items ?? []).filter(
        Boolean,
      ) as Parameters<typeof ProductsList>[0]["products"];
      const totalCount = data?.products?.total_count ?? 0;

      return (
        <div className="container mx-auto px-4 py-8">
          <ProductsList
            products={products}
            totalCount={totalCount}
            categoryName={category.name}
          />
        </div>
      );
    }
  }

  // Multi-segment fallback — could be product under a category path, try last segment
  if (product && slugs.length > 1) {
    return <ProductDetail product={product} />;
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
