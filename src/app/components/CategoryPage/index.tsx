"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Loader2, SlidersHorizontal, X } from "lucide-react";
import ProductsList from "@/src/app/components/ProductsList";
import FilterSidebar, { Aggregation, ActiveFilters } from "@/src/app/components/FilterSidebar";
import SortToolbar, { SortDir, ViewMode } from "@/src/app/components/SortToolbar";

type Product = {
  id: string;
  name: string;
  sku: string;
  price_range: {
    minimum_price: {
      final_price: { value: number; currency: string };
      regular_price?: { value: number; currency: string };
    };
  } | null;
  small_image: { url: string; label: string };
  url_key: string;
  new_from_date?: string | null;
  new_to_date?: string | null;
  special_price?: number | null;
  special_from_date?: string | null;
  special_to_date?: string | null;
  type_id?: string | null;
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

  useEffect(() => {
    if (mobileFiltersOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
    } else {
      const scrollY = parseInt(document.body.style.top || "0") * -1;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, scrollY);
    }
    return () => {
      const scrollY = parseInt(document.body.style.top || "0") * -1;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, scrollY);
    };
  }, [mobileFiltersOpen]);
  const [sortField, setSortField] = useState("position");
  const [sortDir, setSortDir] = useState<SortDir>("ASC");
  const [view, setView] = useState<ViewMode>("grid");

  const fetchProducts = useCallback(
    async (filters: ActiveFilters, page: number, field: string, dir: SortDir, append = false) => {
      const url = new URL("/api/products", window.location.origin);
      url.searchParams.set("categoryId", categoryId);
      url.searchParams.set("pageSize", String(PAGE_SIZE));
      url.searchParams.set("currentPage", String(page));
      url.searchParams.set("sortField", field);
      url.searchParams.set("sortDir", dir);
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
    window.scrollTo({ top: 0, behavior: "smooth" });
    try {
      await fetchProducts(newFilters, 1, sortField, sortDir);
    } finally {
      setLoading(false);
    }
  };

  const clearAll = async () => {
    setActiveFilters({});
    setCurrentPage(1);
    setLoading(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    try {
      await fetchProducts({}, 1, sortField, sortDir);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    const next = currentPage + 1;
    setLoadingMore(true);
    try {
      await fetchProducts(activeFilters, next, sortField, sortDir, true);
      setCurrentPage(next);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSortChange = async (field: string, dir: SortDir) => {
    setSortField(field);
    setSortDir(dir);
    setCurrentPage(1);
    setLoading(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    try {
      await fetchProducts(activeFilters, 1, field, dir);
    } finally {
      setLoading(false);
    }
  };

  const hasMore = products.length < totalCount;
  const hasFilters = aggregations.filter((a) => !["category_id", "category_uid"].includes(a.attribute_code) && a.options.length > 0).length > 0;

  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loadingMore && !loading && window.innerWidth < 1024) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  // loadMore is stable via useCallback but eslint can't see that — deps are correct
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loadingMore, loading]);

  return (
    <div>
      {/* Paired header row — both columns start at exact same y */}
      <div className="hidden lg:flex gap-6 mb-0">
        {hasFilters && (
          <div className="w-52 shrink-0 bg-brand-nav text-white px-3 flex items-center py-1.5">
            <h2 className="font-bold text-xs uppercase tracking-wide text-black">Пазаруване По</h2>
          </div>
        )}
        <div className="flex-1 min-w-0 flex items-center border-b-2 border-brand-nav py-1.5">
          <h1 className="text-2xl font-bold text-gray-800">{categoryName}</h1>
        </div>
      </div>

      {/* Mobile heading */}
      <div className="lg:hidden pt-3 pb-3 mb-4 border-b-2 border-brand-nav">
        <h1 className="text-base font-bold text-gray-800 truncate">{categoryName}</h1>
      </div>

    <div className="flex gap-6 items-start">
      {/* Desktop sidebar — header rendered above, hide it here */}
      {hasFilters && (
        <div className="hidden lg:block">
          <FilterSidebar
            aggregations={aggregations}
            activeFilters={activeFilters}
            onToggle={toggleFilter}
            onClearAll={clearAll}
            showHeader={false}
          />
        </div>
      )}

      {/* Mobile filter button */}
      {hasFilters && (
        <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-stretch shadow-lg rounded-full overflow-hidden">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className={`flex items-center gap-2 bg-brand-nav text-white px-5 py-3 font-semibold text-sm ${Object.keys(activeFilters).length > 0 ? "rounded-l-full" : "rounded-full"}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Филтри
            {Object.keys(activeFilters).length > 0 && (
              <span className="bg-brand-action text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {Object.values(activeFilters).flat().length}
              </span>
            )}
          </button>
          {Object.keys(activeFilters).length > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center justify-center bg-brand-action text-white px-2.5 rounded-r-full text-sm"
              aria-label="Изчисти филтрите"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-60" onClick={() => setMobileFiltersOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-60 w-72 bg-white overflow-y-auto shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
              <span className="font-bold text-gray-800">Филтри</span>
              <button onClick={() => setMobileFiltersOpen(false)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
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
              fullWidth
            />
          </div>
        </>
      )}

      {/* Products area */}
      <div className="flex-1 min-w-0">
        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-10 h-10 animate-spin text-brand-action" />
          </div>
        ) : (
          <>
            <ProductsList
              products={products}
              hasActiveFilters={Object.keys(activeFilters).length > 0}
              onClearFilters={clearAll}
              toolbar={
                <SortToolbar
                  totalCount={totalCount}
                  currentCount={products.length}
                  currentPage={currentPage}
                  pageSize={PAGE_SIZE}
                  sortField={sortField}
                  sortDir={sortDir}
                  view={view}
                  onSortChange={handleSortChange}
                  onViewChange={setView}
                />
              }
              view={view}
            />
            {hasMore && (
              <>
                {/* Desktop: manual load-more button */}
                <div className="hidden lg:flex mt-8 text-center justify-center">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="px-8 py-3 bg-brand-action text-white rounded font-bold uppercase text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 mx-auto"
                  >
                    {loadingMore && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    {loadingMore ? "Зарежда се..." : `Покажи още (${products.length} от ${totalCount})`}
                  </button>
                </div>
                {/* Mobile: infinite scroll sentinel */}
                <div ref={sentinelRef} className="lg:hidden mt-8 mb-20 flex justify-center">
                  {loadingMore && <Loader2 className="w-8 h-8 animate-spin text-brand-action" />}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
    </div>
  );
}
