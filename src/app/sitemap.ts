import type { MetadataRoute } from "next";
import { fetchCatalog, fetchAllProductUrlKeys } from "@/src/app/utils/graphql/fetchers";
import { magentoImageUrl } from "@/src/app/utils/image";

const BASE = "https://omekotitel.bg";

// Single sitemap served at /sitemap.xml.
//
// NOTE: we deliberately do NOT use `generateSitemaps()`. With that export Next.js
// only serves the chunks at /sitemap/<id>.xml and never creates /sitemap.xml — so
// requests to /sitemap.xml 404 and fall through to the HTML not-found page, which
// is exactly what Google Search Console flagged ("Sitemap is HTML"). The whole
// catalog is well under the 50,000-URL / 50 MB single-file limit, so one file is fine.

// ─── Static pages ──────────────────────────────────────────────────────────

const STATIC: MetadataRoute.Sitemap = [
  { url: `${BASE}/`, priority: 1.0, changeFrequency: "weekly" },
  { url: `${BASE}/products`, priority: 0.8, changeFrequency: "weekly" },
  { url: `${BASE}/marki-brands`, priority: 0.7, changeFrequency: "weekly" },
  { url: `${BASE}/dostavka`, priority: 0.5, changeFrequency: "monthly" },
  { url: `${BASE}/nachini-za-plaschane`, priority: 0.5, changeFrequency: "monthly" },
  { url: `${BASE}/contact`, priority: 0.5, changeFrequency: "monthly" },
  { url: `${BASE}/za-nas`, priority: 0.4, changeFrequency: "monthly" },
  { url: `${BASE}/obschi-uslovija`, priority: 0.3, changeFrequency: "monthly" },
  { url: `${BASE}/vr-schane-na-por-chka`, priority: 0.3, changeFrequency: "monthly" },
  { url: `${BASE}/privacy-policy-cookie-restriction-mode`, priority: 0.2, changeFrequency: "monthly" },
];

// ─── Category helpers ──────────────────────────────────────────────────────

interface CatalogCategory {
  url_path: string | null;
  image?: string | null;
  children?: CatalogCategory[];
}

interface CategoryEntry {
  urlPath: string;
  image?: string;
}

function collectCategories(list: CatalogCategory[]): CategoryEntry[] {
  const entries: CategoryEntry[] = [];
  for (const cat of list) {
    if (cat.url_path) {
      entries.push({
        urlPath: cat.url_path,
        image: cat.image ? magentoImageUrl(cat.image) : undefined,
      });
    }
    if (cat.children?.length) entries.push(...collectCategories(cat.children));
  }
  return entries;
}

async function categoryEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    const catalog = await fetchCatalog();
    const root = catalog.categoryList as CatalogCategory[];
    const realCats = (root[0]?.children ?? root) as CatalogCategory[];
    return collectCategories(realCats).map(({ urlPath, image }) => ({
      url: `${BASE}/${urlPath}`,
      priority: 0.8,
      changeFrequency: "weekly" as const,
      ...(image ? { images: [image] } : {}),
    }));
  } catch {
    return [];
  }
}

async function productEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    const urlKeys = await fetchAllProductUrlKeys();
    return urlKeys.map((key) => ({
      url: `${BASE}/${key}`,
      priority: 0.9,
      changeFrequency: "weekly" as const,
    }));
  } catch {
    return [];
  }
}

// ─── Default export — one combined sitemap ─────────────────────────────────

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([
    categoryEntries(),
    productEntries(),
  ]);
  return [...STATIC, ...categories, ...products];
}
