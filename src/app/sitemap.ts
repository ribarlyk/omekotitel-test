import type { MetadataRoute } from "next";
import { fetchCatalog, fetchAllProductUrlKeys } from "@/src/app/utils/graphql/fetchers";
import { magentoImageUrl } from "@/src/app/utils/image";

const BASE = "https://omekotitel.bg";

// ─── Chunk IDs ─────────────────────────────────────────────────────────────
// Next.js renders /sitemap.xml as an index referencing /sitemap/0.xml, /sitemap/1.xml …
// Each id maps to one chunk below.

export async function generateSitemaps() {
  return [
    { id: "static" },
    { id: "categories" },
    { id: "products" },
  ];
}

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

// ─── Default export — called per chunk ────────────────────────────────────

export default async function sitemap({
  id,
}: {
  id: string;
}): Promise<MetadataRoute.Sitemap> {
  if (id === "static") {
    return STATIC;
  }

  if (id === "categories") {
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

  if (id === "products") {
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

  return [];
}
