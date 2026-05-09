"use client";

import { useState } from "react";
import ProductsList from "../ProductsList";

interface Category {
  id: number;
  name: string;
  url_path: string | null;
  url_key: string | null;
  level: number;
  position: number;
  product_count: number;
  children_count: string;
  children?: Category[];
}

interface CatalogProps {
  catalog: {
    categoryList: Category[];
  };
}

interface Product {
  id: string;
  name: string;
  sku: string;
  price_range: {
    minimum_price: {
      final_price: { value: number; currency: string };
      regular_price?: { value: number; currency: string };
    };
  };
  small_image: { url: string; label: string };
  url_key: string;
  new_from_date?: string | null;
  new_to_date?: string | null;
  special_price?: number | null;
  special_from_date?: string | null;
  special_to_date?: string | null;
  type_id?: string | null;
}

function CategoryItem({
  category,
  onCategoryClick,
}: {
  category: Category;
  onCategoryClick: (category: Category) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div className="ml-4">
      <div className="flex items-center gap-2 py-1 hover:bg-gray-100 px-2 rounded">
        {hasChildren && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-5 h-5 flex items-center justify-center text-gray-600 hover:text-gray-900"
          >
            {isExpanded ? "▼" : "▶"}
          </button>
        )}
        {!hasChildren && <span className="w-5" />}
        <button
          onClick={() => onCategoryClick(category)}
          className="flex-1 text-left hover:text-blue-600"
        >
          {category.name}
          <span className="text-gray-500 text-sm ml-2">
            (ID: {category.id}) ({category.product_count})
          </span>
        </button>
      </div>
      {hasChildren && isExpanded && (
        <div className="ml-2">
          {category.children?.map((child) => (
            <CategoryItem
              key={child.id}
              category={child}
              onCategoryClick={onCategoryClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Catalog({ catalog }: CatalogProps) {
  const [expandAll, setExpandAll] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const pageSize = 12;

  const handleCategoryClick = async (category: Category) => {
    setSelectedCategory(category);
    setLoading(true);
    setCurrentPage(1);
    setProducts([]);

    try {
      const response = await fetch(
        `/api/products?categoryId=${category.id}&pageSize=${pageSize}&currentPage=1`,
      );
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products.items);
        setTotalCount(data.products.total_count);
      } else {
        console.error("Failed to fetch products");
        setProducts([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (!selectedCategory) return;
    
    setLoadingMore(true);
    const nextPage = currentPage + 1;

    try {
      const response = await fetch(
        `/api/products?categoryId=${selectedCategory.id}&pageSize=${pageSize}&currentPage=${nextPage}`,
      );
      if (response.ok) {
        const data = await response.json();
        setProducts((prev) => [...prev, ...data.products.items]);
        setCurrentPage(nextPage);
      } else {
        console.error("Failed to fetch more products");
      }
    } catch (error) {
      console.error("Error fetching more products:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const hasMoreProducts = products.length < totalCount;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Catalog Tree</h1>
        <button
          onClick={() => setExpandAll(!expandAll)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {expandAll ? "Collapse All" : "Expand All"}
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white border rounded-lg p-4 h-fit">
          <h2 className="font-semibold mb-3">Categories</h2>
          {catalog?.categoryList?.map((category) => (
            <CategoryItem
              key={category.id}
              category={category}
              onCategoryClick={handleCategoryClick}
            />
          ))}
        </div>
        <div className="lg:col-span-2">
          {loading ? (
            <div className="text-center py-8">Loading products...</div>
          ) : selectedCategory ? (
            <>
              <ProductsList
                products={products}
              />
              {hasMoreProducts && (
                <div className="mt-6 text-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loadingMore ? (
                      <span className="flex items-center gap-2">
                        <svg
                          className="animate-spin h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Loading...
                      </span>
                    ) : (
                      `Load More (${products.length} of ${totalCount})`
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Select a category to view products
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
