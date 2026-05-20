import { magentoImageUrl } from "@/src/app/utils/image";
import type { BreadcrumbItem } from "@/src/app/types/seo";

export const SITE_URL = "https://omekotitel.bg";
export const SITE_NAME = "Omekotitel.bg";
export const DEFAULT_DESCRIPTION =
  "Открийте широк асортимент от омекотители, перилни препарати и домашни аксесоари. Бърза доставка до офис на Еконт или Спиди в цяла България.";

export const PRICE_CURRENCY = "EUR";

export function stripHtml(html: string | undefined | null): string {
  if (!html) return "";
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function truncate(text: string, max = 160): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd() + "...";
}

// ─── Product schema ────────────────────────────────────────────────────────

export interface ProductSchemaInput {
  name: string;
  sku: string;
  url: string;
  description?: string;
  image?: string | string[];
  price: number;
  currency?: string;
  inStock: boolean;
  brand?: string | null;
  // ISO date string — populated when a special price has an end date
  priceValidUntil?: string | null;
}

export function buildProductSchema(p: ProductSchemaInput): Record<string, unknown> {
  const images = Array.isArray(p.image)
    ? p.image.filter(Boolean).map(magentoImageUrl)
    : p.image
      ? [magentoImageUrl(p.image)]
      : undefined;

  return {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: p.name,
    sku: p.sku,
    description: p.description || undefined,
    image: images,
    brand: p.brand ? { "@type": "Brand", name: p.brand } : undefined,
    offers: {
      "@type": "Offer",
      url: p.url,
      priceCurrency: p.currency ?? PRICE_CURRENCY,
      price: p.price.toFixed(2),
      priceValidUntil: p.priceValidUntil ?? undefined,
      availability: p.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_URL,
      },
    },
    // TODO: enable when Magento exposes rating_summary / review_count on products resolver
    // aggregateRating: { "@type": "AggregateRating", ratingValue, reviewCount, bestRating: 5 }
  };
}

// ─── OG product meta inputs (used by ProductOGMeta component) ──────────────

export interface ProductOGMetaInput {
  price: number;
  currency?: string;
  inStock: boolean;
  brand?: string | null;
}

// ─── BreadcrumbList schema ─────────────────────────────────────────────────

export function buildBreadcrumbSchema(items: BreadcrumbItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org/",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// ─── Organization + WebSite (root layout) ──────────────────────────────────

export function buildOrganizationSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org/",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/assets/hero-omekotitel.png`,
    sameAs: [
      "https://www.facebook.com/omekotitel",
      "https://www.instagram.com/omekotitel.bg",
      "https://www.tiktok.com/@omekotitel.bg",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      areaServed: "BG",
      availableLanguage: ["Bulgarian"],
    },
  };
}

export function buildWebSiteSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org/",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "bg-BG",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}
