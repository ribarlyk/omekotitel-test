"use client";
import Link from "next/link";
import { magentoImageUrl } from "@/src/app/utils/image";
import MagentoImage from "@/src/app/components/MagentoImage";
import type { ViewMode } from "@/src/app/components/SortToolbar";
import type { ReactNode } from "react";

interface Product {
  id: string;
  name: string;
  sku: string;
  price_range: {
    minimum_price: {
      final_price: {
        value: number;
        currency: string;
      };
    };
  } | null;
  small_image: {
    url: string;
    label: string;
  };
  url_key: string;
}

interface ProductsListProps {
  products: Product[];
  toolbar?: ReactNode;
  view?: ViewMode;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
}

export default function ProductsList({
  products,
  toolbar,
  view = "grid",
  hasActiveFilters = false,
  onClearFilters,
}: ProductsListProps) {
  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 gap-4 text-gray-500">
        <p>Няма намерени продукти в тази категория.</p>
        {hasActiveFilters && onClearFilters && (
          <button
            onClick={onClearFilters}
            className="px-5 py-2 bg-brand-action text-white text-sm font-semibold rounded hover:opacity-90 transition-opacity"
          >
            Изчисти филтрите
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      {toolbar}

      {view === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product, index) => (
            <Link
              key={product.id}
              href={`/${product.url_key}`}
              className="flex flex-col border border-gray-200 rounded-xl p-4 bg-white hover:shadow-lg hover:border-brand-action/40 transition-all duration-200 group"
            >
              <div className="rounded-lg bg-gray-50 mb-4 overflow-hidden">
                <MagentoImage
                  src={magentoImageUrl(product.small_image.url)}
                  alt={product.small_image.label || product.name}
                  width={200}
                  height={200}
                  style={{ width: "100%", height: "200px", objectFit: "contain" }}
                  className="transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) calc(100vw - 2rem), (max-width: 1024px) calc(50vw - 1.5rem), (max-width: 1280px) calc(33vw - 1.5rem), calc(25vw - 1.5rem)"
                  loading={index === 0 ? "eager" : "lazy"}
                  fetchPriority={index === 0 ? "high" : "auto"}
                />
              </div>
              <h3 className="font-medium text-sm mb-3 line-clamp-2 flex-1 text-gray-800 group-hover:text-brand-nav transition-colors leading-snug">
                {product.name}
              </h3>
              <div className="mt-auto">
                <p className="hidden md:block text-gray-400 text-xs mb-1">SKU: {product.sku}</p>
                <p className="text-lg font-bold text-brand-action">
                  {product.price_range
                    ? `${product.price_range.minimum_price.final_price.value.toFixed(2)} ${product.price_range.minimum_price.final_price.currency}`
                    : "—"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {products.map((product, index) => (
            <Link
              key={product.id}
              href={`/${product.url_key}`}
              className="flex gap-4 border border-gray-200 rounded-xl p-4 bg-white hover:shadow-lg hover:border-brand-action/40 transition-all duration-200 group"
            >
              <div className="rounded-lg bg-gray-50 shrink-0 overflow-hidden">
                <MagentoImage
                  src={magentoImageUrl(product.small_image.url)}
                  alt={product.small_image.label || product.name}
                  width={120}
                  height={120}
                  style={{ width: "120px", height: "120px", objectFit: "contain" }}
                  className="transition-transform duration-300 group-hover:scale-105"
                  sizes="120px"
                  loading={index === 0 ? "eager" : "lazy"}
                  fetchPriority={index === 0 ? "high" : "auto"}
                />
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <h3 className="font-medium text-sm mb-2 line-clamp-2 text-gray-800 group-hover:text-brand-nav transition-colors leading-snug">
                  {product.name}
                </h3>
                <p className="text-gray-400 text-xs mb-2">SKU: {product.sku}</p>
                <p className="text-lg font-bold text-brand-action">
                  {product.price_range
                    ? `${product.price_range.minimum_price.final_price.value.toFixed(2)} ${product.price_range.minimum_price.final_price.currency}`
                    : "—"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
