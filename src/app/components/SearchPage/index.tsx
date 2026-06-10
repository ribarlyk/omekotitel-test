"use client";

import { useState, useCallback, useEffect, useRef, startTransition } from "react";
import { Loader2, SlidersHorizontal, X } from "lucide-react";
import ProductsList from "@/src/app/components/ProductsList";
import FilterSidebar, { Aggregation, ActiveFilters } from "@/src/app/components/FilterSidebar";
import SortToolbar, { SortDir, ViewMode, SEARCH_SORT_OPTIONS } from "@/src/app/components/SortToolbar";

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

interface SearchPageProps {
  query: string;
  initialProducts: Product[];
  initialTotalCount: number;
  aggregations: Aggregation[];
}

const PAGE_SIZE = 20;

export default function SearchPage({ query, initialProducts, initialTotalCount, aggregations }: SearchPageProps) {
  const [products, setProducts] = useState(initialProducts);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({});
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [sortField, setSortField] = useState("relevance");
  const [sortDir, setSortDir] = useState<SortDir>("ASC");
  const [view, setView] = useState<ViewMode>("grid");
  const [loadMoreError, setLoadMoreError] = useState(false);

  useEffect(() => {
    setProducts(initialProducts);
    setTotalCount(initialTotalCount);
    setActiveFilters({});
    setCurrentPage(1);
    setSortField("relevance");
    setSortDir("ASC");
    setLoadMoreError(false);
  }, [query]);

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

  const fetchProducts = useCallback(
    async (filters: ActiveFilters, page: number, field: string, dir: SortDir, append = false) => {
      const url = new URL("/api/search", window.location.origin);
      url.searchParams.set("q", query);
      url.searchParams.set("pageSize", String(PAGE_SIZE));
      url.searchParams.set("currentPage", String(page));
      if (field !== "relevance") {
        url.searchParams.set("sortField", field);
        url.searchParams.set("sortDir", dir);
      }
      if (Object.keys(filters).length > 0) {
        url.searchParams.set("filters", JSON.stringify(filters));
      }
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch search results");
      const data = await res.json();
      const items = (data.products?.items ?? []) as Product[];
      startTransition(() => {
        if (append) {
          setProducts((prev) => {
            const seen = new Set(prev.map((p) => p.id));
            return [...prev, ...items.filter((p) => !seen.has(p.id))];
          });
        } else {
          setProducts(items);
        }
        setTotalCount(data.products?.total_count ?? 0);
      });
    },
    [query]
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
    setLoadMoreError(false);
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
    setLoadMoreError(false);
    setLoading(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    try {
      await fetchProducts({}, 1, sortField, sortDir);
    } finally {
      setLoading(false);
    }
  };

  const isLoadingMoreRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (isLoadingMoreRef.current) return;
    isLoadingMoreRef.current = true;
    setLoadingMore(true);
    const next = currentPage + 1;
    try {
      await fetchProducts(activeFilters, next, sortField, sortDir, true);
      setCurrentPage(next);
    } catch {
      setLoadMoreError(true);
    } finally {
      setLoadingMore(false);
      isLoadingMoreRef.current = false;
    }
  }, [currentPage, fetchProducts, activeFilters, sortField, sortDir]);

  const handleSortChange = async (field: string, dir: SortDir) => {
    setSortField(field);
    setSortDir(dir);
    setCurrentPage(1);
    setLoadMoreError(false);
    setLoading(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    try {
      await fetchProducts(activeFilters, 1, field, dir);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const hasMore = !loadMoreError && currentPage < totalPages;
  const hasFilters = aggregations.filter(
    (a) => !["category_id", "category_uid"].includes(a.attribute_code) && a.options.length > 0
  ).length > 0;

  return (
    <div>
      {/* Header row */}
      <div className="hidden lg:flex gap-6 mb-0">
        {hasFilters && (
          <div className="w-52 shrink-0 bg-brand-action text-white px-3 flex items-center py-1.5">
            <h2 className="font-bold text-xs uppercase tracking-wide">Пазаруване По</h2>
          </div>
        )}
        <div className="flex-1 min-w-0 flex items-center border-b-2 border-brand-nav py-1.5">
          <h1 className="text-2xl font-bold text-gray-800">
            Резултати за &ldquo;{query}&rdquo;
          </h1>
        </div>
      </div>

      {/* Mobile heading */}
      <div className="lg:hidden pt-3 pb-3 mb-4 border-b-2 border-brand-nav">
        <h1 className="text-base font-bold text-gray-800">Резултати за &ldquo;{query}&rdquo;</h1>
      </div>

      <div className="flex gap-6 items-start">
        {/* Desktop sidebar */}
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
                onToggle={(code, value) => { toggleFilter(code, value); setMobileFiltersOpen(false); }}
                onClearAll={() => { clearAll(); setMobileFiltersOpen(false); }}
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
              {totalCount === 0 ? (
                <p className="text-gray-500 mt-4">Няма намерени продукти.</p>
              ) : (
                <ProductsList
                  products={products}
                  hasActiveFilters={Object.keys(activeFilters).length > 0}
                  onClearFilters={clearAll}
                  toolbar={
                    <SortToolbar
                      totalCount={totalCount}
                      currentCount={products.length}
                      sortField={sortField}
                      sortDir={sortDir}
                      view={view}
                      onSortChange={handleSortChange}
                      onViewChange={setView}
                      sortOptions={SEARCH_SORT_OPTIONS}
                    />
                  }
                  view={view}
                />
              )}
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
    </div>
  );
}
