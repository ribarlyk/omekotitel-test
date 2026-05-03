"use client";
import Link from "next/link";
import { magentoImageUrl } from "@/src/app/utils/image";
import MagentoImage from "@/src/app/components/MagentoImage";

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
  totalCount: number;
  categoryName?: string;
}




export default function ProductsList({
  products,
  totalCount,
  categoryName,
}: ProductsListProps) {
  if (!products || products.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No products found in this category.
      </div>
    );
  }

  return (
    <div className="mt-6">
      {categoryName && (
        <h2 className="text-xl font-semibold mb-4">
          {categoryName} ({totalCount} products)
        </h2>
      )}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((product, index) => (
          <Link
            key={product.id}
            href={`/${product.url_key}`}
            className="border rounded-lg p-4 hover:shadow-lg transition-shadow block"
          >
            <MagentoImage
              src={magentoImageUrl(product.small_image.url)}
              alt={product.small_image.label || product.name}
              width={200}
              height={200}
              style={{ width: "100%", height: "220px", objectFit: "contain" }}
              className="mb-3 rounded"
              sizes="(max-width: 640px) calc(100vw - 2rem), (max-width: 1024px) calc(50vw - 1.5rem), (max-width: 1280px) calc(33vw - 1.5rem), calc(25vw - 1.5rem)"
              loading={index === 0 ? "eager" : "lazy"}
              fetchPriority={index === 0 ? "high" : "auto"}
            />
            <h3 className="font-medium text-sm mb-2 line-clamp-2">
              {product.name}
            </h3>
            <p className="hidden md:block text-gray-600 text-xs mb-2">SKU: {product.sku}</p>
            <p className="text-lg font-bold text-blue-600">
              {product.price_range
                ? `${product.price_range.minimum_price.final_price.value.toFixed(2)} ${product.price_range.minimum_price.final_price.currency}`
                : "—"}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
