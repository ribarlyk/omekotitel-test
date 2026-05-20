// SEO-related TypeScript types

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface ProductSchemaData {
  name: string;
  sku: string;
  description?: string;
  image?: string;
  price: number;
  currency: string;
  availability: "InStock" | "OutOfStock";
  brand?: string;
  url: string;
  ratingValue?: number;
  reviewCount?: number;
}

export interface CategoryWithSEO {
  id: number;
  name: string;
  url_path: string | null;
  url_key: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
  product_count?: number;
  children?: CategoryWithSEO[];
}

export interface ProductWithSEO {
  name: string;
  sku: string;
  url_key: string;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keyword?: string | null;
  short_description?: { html: string };
  description?: { html: string };
  image?: { url: string; label: string };
  price_range: {
    minimum_price: {
      final_price: {
        value: number;
        currency: string;
      };
    };
  };
  stock_status: string;
  rating_summary?: number | null;
  review_count?: number | null;
  marki?: string | null; // Magento manufacturer/brand attribute
  categories?: { name: string; url_path: string }[];
}
