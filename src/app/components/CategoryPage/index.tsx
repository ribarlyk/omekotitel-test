"use client";

import { useState, useCallback } from "react";
import { Loader2, SlidersHorizontal, X } from "lucide-react";
import ProductsList from "@/src/app/components/ProductsList";
import FilterSidebar, { Aggregation, ActiveFilters } from "@/src/app/components/FilterSidebar";

type Product = {
  id: string;
  name: string;
  sku: string;
  price_range: {
    minimum_price: { final_price: { value: number; currency: string } };
  } | null;
  small_image: { url: string; label: string };
  url_key: string;
};

interface CategoryPageProps {
  categoryId: string;
  categoryName: string;
  initialProducts: Product[];
  initialTotalCount: number;
  aggregations: Aggregation[];
}

const PAGE_SIZE = 20;

export default function CategoryPage({
  categoryId,
  categoryName,
  initialProducts,
  initialTotalCount,
  aggregations,
}: CategoryPageProps) {
  const [products, setProducts] = useState(initialProducts);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({});
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const fetchProducts = useCallback(
    async (filters: ActiveFilters, page: number, append = false) => {
      const url = new URL("/api/products", window.location.origin);
      url.searchParams.set("categoryId", categoryId);
      url.searchParams.set("pageSize", String(PAGE_SIZE));
      url.searchParams.set("currentPage", String(page));
      if (Object.keys(filters).length > 0) {
        url.searchParams.set("filters", JSON.stringify(filters));
      }

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();

      const items = (data.products?.items ?? []) as Product[];
      if (append) {
        setProducts((prev) => [...prev, ...items]);
      } else {
        setProducts(items);
      }
      setTotalCount(data.products?.total_count ?? 0);
    },
    [categoryId]
  );

  const toggleFilter = async (code: string, value: string) => {
    const current = activeFilters[code] ?? [];
    // Price is single-select; all others are multi-select
    const next =
      code === "price"
        ? current.includes(value) ? [] : [value]
        : current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value];

    const newFilters = { ...activeFilters };
    if (next.length === 0) delete newFilters[code];
    else newFilters[code] = next;

    setActiveFilters(newFilters);
    setCurrentPage(1);
    setLoading(true);
    try {
      await fetchProducts(newFilters, 1);
    } finally {
      setLoading(false);
    }
  };

  const clearAll = async () => {
    setActiveFilters({});
    setCurrentPage(1);
    setLoading(true);
    try {
      await fetchProducts({}, 1);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    const next = currentPage + 1;
    setLoadingMore(true);
    try {
      await fetchProducts(activeFilters, next, true);
      setCurrentPage(next);
    } finally {
      setLoadingMore(false);
    }
  };

  const hasMore = products.length < totalCount;
  const hasFilters = aggregations.filter((a) => !["category_id", "category_uid"].includes(a.attribute_code) && a.options.length > 0).length > 0;

  return (
    <div className="flex gap-6 items-start">
      {/* Desktop sidebar */}
      {hasFilters && (
        <div className="hidden lg:block sticky top-4">
          <FilterSidebar
            aggregations={aggregations}
            activeFilters={activeFilters}
            onToggle={toggleFilter}
            onClearAll={clearAll}
          />
        </div>
      )}

      {/* Mobile filter button */}
      {hasFilters && (
        <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="flex items-center gap-2 bg-brand-nav text-white px-5 py-3 rounded-full shadow-lg font-semibold text-sm"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Филтри
            {Object.keys(activeFilters).length > 0 && (
              <span className="bg-brand-action text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {Object.values(activeFilters).flat().length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setMobileFiltersOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <span className="font-bold text-gray-800">Филтри</span>
              <button onClick={() => setMobileFiltersOpen(false)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-2">
              <FilterSidebar
                aggregations={aggregations}
                activeFilters={activeFilters}
                onToggle={(code, value) => {
                  toggleFilter(code, value);
                  setMobileFiltersOpen(false);
                }}
                onClearAll={() => {
                  clearAll();
                  setMobileFiltersOpen(false);
                }}
              />
            </div>
          </div>
        </>
      )}

      {/* Products area */}
      <div className="flex-1 min-w-0">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-brand-action" />
          </div>
        ) : (
          <>
            <ProductsList
              products={products}
              totalCount={totalCount}
              categoryName={categoryName}
            />
            {hasMore && (
              <div className="mt-8 mb-16 lg:mb-0 text-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-8 py-3 bg-brand-action text-white rounded font-bold uppercase text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 mx-auto"
                >
                  {loadingMore && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {loadingMore ? "Зарежда се..." : `Покажи още (${products.length} от ${totalCount})`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
