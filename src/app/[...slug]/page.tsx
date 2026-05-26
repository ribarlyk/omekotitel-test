import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import type { Metadata } from "next";

import ProductDetail from "@/src/app/components/ProductDetail";
import CategoryPage from "@/src/app/components/CategoryPage";
import { Aggregation } from "@/src/app/components/FilterSidebar";
import {
  fetchCatalog,
  fetchProductsByCategory,
  fetchProductDetail,
  fetchAttributeMetadata,
} from "@/src/app/utils/graphql/fetchers";
import {
  buildOptionMap,
  resolveProductAttributes,
} from "@/src/app/utils/productAttributes";
import { magentoImageUrl } from "@/src/app/utils/image";
import { JsonLd } from "@/src/app/components/JsonLd";
import { ProductOGMeta } from "@/src/app/components/ProductOGMeta";
import {
  SITE_URL,
  SITE_NAME,
  PRICE_CURRENCY,
  stripHtml,
  buildProductSchema,
  buildBreadcrumbSchema,
} from "@/src/app/utils/seo";
import type { BreadcrumbItem } from "@/src/app/types/seo";

interface Category {
  id: number;
  name: string;
  url_key: string | null;
  url_path: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  product_count?: number;
  image?: string | null;
  children?: Category[];
}

const DEFAULT_OG_IMAGE = `${SITE_URL}/assets/hero-omekotitel.png`;

interface ProductMeta {
  name: string;
  sku: string;
  url_key: string;
  meta_title?: string | null;
  meta_description?: string | null;
  short_description?: { html: string };
  description?: { html: string };
  image?: { url: string; label: string };
  media_gallery?: Array<{ url: string; label: string; position: number }>;
  price_range: {
    minimum_price: { final_price: { value: number; currency: string } };
  };
  stock_status: string;
  special_price?: number | null;
  special_to_date?: string | null;
  marki?: string | null;
  categories?: { name: string; url_path: string }[];
}

function collectUrlPaths(list: Category[]): string[] {
  const paths: string[] = [];
  for (const cat of list) {
    if (cat.url_path) paths.push(cat.url_path);
    if (cat.children?.length) paths.push(...collectUrlPaths(cat.children));
  }
  return paths;
}

const EXCLUDED_STATIC_PREFIXES = ["marki-brands"];

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

function buildProductBreadcrumbs(product: ProductMeta): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [
    { name: "Начало", url: `${SITE_URL}/` },
  ];
  const primaryCat = product.categories?.[0];
  if (primaryCat?.url_path) {
    items.push({
      name: primaryCat.name,
      url: `${SITE_URL}/${primaryCat.url_path}`,
    });
  }
  items.push({ name: product.name, url: `${SITE_URL}/${product.url_key}` });
  return items;
}

function buildCategoryBreadcrumbs(
  category: Category,
  catalogRoot: Category[],
): BreadcrumbItem[] {
  // Walk url_path segments to assemble ancestors (e.g. "parent/child" → Начало / parent / child)
  const items: BreadcrumbItem[] = [{ name: "Начало", url: `${SITE_URL}/` }];
  if (!category.url_path) return items;
  const segments = category.url_path.split("/");
  for (let i = 0; i < segments.length; i++) {
    const partial = segments.slice(0, i + 1).join("/");
    const node = findCategoryByUrlPath(catalogRoot, partial);
    if (node) {
      items.push({ name: node.name, url: `${SITE_URL}/${partial}` });
    }
  }
  return items;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const urlKey = slug[slug.length - 1];

  // Try product first
  try {
    const productData = await fetchProductDetail(urlKey);
    const product = productData?.products?.items?.[0] as ProductMeta | undefined;

    if (product && slug.length === 1) {
      const autoTitle = `${product.name} - купи онлайн`;
      const title = product.meta_title?.trim() || autoTitle;

      const rawDesc =
        product.meta_description?.trim() ||
        stripHtml(product.short_description?.html) ||
        stripHtml(product.description?.html);
      const description = rawDesc
        || `Поръчай ${product.name} онлайн с бърза доставка от ${SITE_NAME}.`;

      const canonicalPath = `/${product.url_key}`;
      const ogImage = product.image?.url
        ? magentoImageUrl(product.image.url)
        : DEFAULT_OG_IMAGE;

      return {
        title,
        description,
        alternates: { canonical: canonicalPath },
        openGraph: {
          title,
          description,
          url: canonicalPath,
          siteName: SITE_NAME,
          locale: "bg_BG",
          images: [{ url: ogImage, width: 1200, height: 630, alt: product.name }],
        },
      };
    }
  } catch {}

  // Then category
  try {
    const catalog = await fetchCatalog();
    const urlPath = slug.join("/");
    const category = findCategoryByUrlPath(
      catalog.categoryList as Category[],
      urlPath,
    );
    if (category) {
      const autoTitle = category.product_count
        ? `${category.name} - ${category.product_count} продукта`
        : category.name;
      const title = category.meta_title?.trim() || autoTitle;
      const description =
        category.meta_description?.trim() ||
        `Разгледай ${category.name} в ${SITE_NAME} — широк избор, бърза доставка в цяла България.`;
      const ogImage = category.image
        ? magentoImageUrl(category.image)
        : DEFAULT_OG_IMAGE;

      return {
        title,
        description,
        alternates: { canonical: `/${category.url_path}` },
        openGraph: {
          title,
          description,
          type: "website",
          url: `/${category.url_path}`,
          siteName: SITE_NAME,
          locale: "bg_BG",
          images: [{ url: ogImage, width: 1200, height: 630, alt: category.name }],
        },
      };
    }
  } catch {}

  return {};
}

export async function generateStaticParams() {
  try {
    const catalog = await fetchCatalog();
    if (!catalog) return [];
    const urlPaths = collectUrlPaths(catalog.categoryList as Category[]).filter(
      (p) => !EXCLUDED_STATIC_PREFIXES.some((prefix) => p === prefix || p.startsWith(prefix + "/")),
    );
    return urlPaths.map((urlPath) => ({ slug: urlPath.split("/") }));
  } catch {
    return [];
  }
}

async function PageData({ slugs }: { slugs: string[] }) {
  const urlKey = slugs[slugs.length - 1];

  const [productData, catalog, attrMetaItems] = await Promise.all([
    fetchProductDetail(urlKey),
    fetchCatalog(),
    fetchAttributeMetadata(),
  ]);

  const rawProduct = productData?.products?.items?.[0] as Record<string, unknown> | undefined;
  const product = rawProduct as Parameters<typeof ProductDetail>[0]["product"] | undefined;

  const optionMap = buildOptionMap(attrMetaItems);

  // Single-segment product match
  if (product && rawProduct && slugs.length === 1) {
    const resolvedAttributes = resolveProductAttributes(rawProduct, optionMap);
    const meta = rawProduct as unknown as ProductMeta;
    const inStock = (meta.stock_status ?? "IN_STOCK") === "IN_STOCK";
    const images = [
      meta.image?.url,
      ...(meta.media_gallery ?? []).map((m) => m.url),
    ].filter((u): u is string => Boolean(u));

    const brandLabel = meta.marki
      ? (optionMap["marki"]?.[String(meta.marki)] ?? undefined)
      : undefined;

    // Use special_to_date as priceValidUntil only when a special price is active
    const priceValidUntil =
      meta.special_price && meta.special_to_date ? meta.special_to_date : null;

    const productSchema = buildProductSchema({
      name: meta.name,
      sku: meta.sku,
      url: `${SITE_URL}/${meta.url_key}`,
      description:
        stripHtml(meta.short_description?.html) ||
        stripHtml(meta.description?.html) ||
        undefined,
      image: images.length ? images : undefined,
      price: meta.price_range.minimum_price.final_price.value,
      currency: PRICE_CURRENCY,
      inStock,
      brand: brandLabel,
      priceValidUntil,
    });
    const breadcrumbSchema = buildBreadcrumbSchema(buildProductBreadcrumbs(meta));

    return (
      <>
        <ProductOGMeta
          price={meta.price_range.minimum_price.final_price.value}
          currency={PRICE_CURRENCY}
          inStock={inStock}
          brand={brandLabel}
        />
        <JsonLd data={[productSchema, breadcrumbSchema]} />
        <ProductDetail
          product={product}
          resolvedAttributes={resolvedAttributes}
        />
      </>
    );
  }

  // Category match
  if (catalog) {
    const urlPath = slugs.join("/");
    const catalogRoot = catalog.categoryList as Category[];
    const category = findCategoryByUrlPath(catalogRoot, urlPath);
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

  // Multi-segment fallback — product under category path
  if (product && rawProduct && slugs.length > 1) {
    const resolvedAttributes = resolveProductAttributes(rawProduct, optionMap);
    return (
      <ProductDetail
        product={product}
        resolvedAttributes={resolvedAttributes}
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

  // Hoist category BreadcrumbList JSON-LD outside <Suspense> so Google sees it
  // in the initial HTML without waiting for the streaming boundary to resolve.
  // fetchCatalog() is cached — this call costs nothing extra.
  let categoryBreadcrumbSchema: Record<string, unknown> | null = null;
  try {
    const catalog = await fetchCatalog();
    const urlPath = slug.join("/");
    const category = findCategoryByUrlPath(
      catalog.categoryList as Category[],
      urlPath,
    );
    if (category) {
      categoryBreadcrumbSchema = buildBreadcrumbSchema(
        buildCategoryBreadcrumbs(category, catalog.categoryList as Category[]),
      );
    }
  } catch {}

  return (
    <>
      {categoryBreadcrumbSchema && <JsonLd data={categoryBreadcrumbSchema} />}
      <Suspense
        fallback={
          <div className="fixed inset-0 flex items-center justify-center">
            <Loader2 className="w-16 h-16 animate-spin text-brand-action" />
          </div>
        }
      >
        <PageData slugs={slug} />
      </Suspense>
    </>
  );
}
