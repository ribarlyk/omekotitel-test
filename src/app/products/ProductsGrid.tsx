"use client";

import Image from "next/image";
import { magentoImageUrl } from "@/src/app/utils/image";

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
    maximum_price: {
      final_price: {
        value: number;
        currency: string;
      };
    };
  };
  small_image: {
    url: string;
    label: string;
  };
  url_key?: string;
  type_id?: string;
}

interface ProductsGridProps {
  products: Product[];
  total_count: number;
  page_info: {
    current_page: number;
    page_size: number;
    total_pages: number;
  };
}

export function ProductsGrid({
  products,
  total_count,
  page_info,
}: ProductsGridProps) {
  return (
    <>
      <div className="mb-4 text-sm text-gray-600">
        Showing page {page_info.current_page} of {page_info.total_pages} (
        {total_count} total products)
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product, index) => (
          <div
            key={product.id}
            className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <Image
              src={magentoImageUrl(product.small_image.url)}
              alt={product.small_image.label}
              width={200}
              height={160}
              style={{ width: "100%", height: "160px", objectFit: "contain" }}
              className="mb-3 rounded"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              loading={index < 3 ? "eager" : "lazy"}
              fetchPriority={index < 3 ? "high" : "auto"}
            />

            <h3 className="font-semibold text-lg mb-2 line-clamp-2">
              {product.name}
            </h3>
            <p className="text-sm text-gray-600 mb-2">SKU: {product.sku}</p>

            <div className="price">
              <span className="text-lg font-bold text-green-600">
                {product.price_range.minimum_price.final_price.currency}{" "}
                {product.price_range.minimum_price.final_price.value}
              </span>
              {product.price_range.minimum_price.final_price.value !==
                product.price_range.maximum_price.final_price.value && (
                <span className="text-sm text-gray-500 ml-2">
                  - {product.price_range.maximum_price.final_price.currency}{" "}
                  {product.price_range.maximum_price.final_price.value}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <p className="text-center text-gray-500 mt-8">No products found.</p>
      )}
    </>
  );
}
