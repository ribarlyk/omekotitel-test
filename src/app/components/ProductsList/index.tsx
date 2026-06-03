"use client";
import type { ReactNode } from "react";
import type { ViewMode } from "@/src/app/components/SortToolbar";
import ProductCard, { type ProductCardProduct } from "@/src/app/components/ProductCard";

interface ProductsListProps {
  products: ProductCardProduct[];
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
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} view="grid" priority={index < 4} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} view="list" priority={index < 4} />
          ))}
        </div>
      )}
    </div>
  );
}
