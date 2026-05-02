"use client";

import { useLayoutEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { magentoImageUrl } from "@/src/app/utils/image";
import { useBreadcrumb } from "@/src/app/contexts/BreadcrumbContext";

interface ProductDetailProps {
  product: {
    id: string;
    name: string;
    sku: string;
    description: {
      html: string;
    };
    short_description: {
      html: string;
    };
    price_range: {
      minimum_price: {
        final_price: {
          value: number;
          currency: string;
        };
        regular_price: {
          value: number;
          currency: string;
        };
      };
    };
    image: {
      url: string;
      label: string;
    };
    media_gallery: Array<{
      url: string;
      label: string;
      position: number;
    }>;
    categories: Array<{
      id: number;
      name: string;
      url_path: string;
    }>;
    url_key: string;
    type_id: string;
    stock_status: string;
  };
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const { setLastCrumbLabel } = useBreadcrumb();

  useLayoutEffect(() => {
    setLastCrumbLabel(product.sku);
    return () => setLastCrumbLabel(null);
  }, [product.sku, setLastCrumbLabel]);

  const finalPrice = product.price_range.minimum_price.final_price;
  const regularPrice = product.price_range.minimum_price.regular_price;
  const hasDiscount = finalPrice.value < regularPrice.value;
  console.log("product", product);
  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/catalog"
        className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
      >
        ← Back to Catalog
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
        <div>
          <Image
            src={magentoImageUrl(product.image.url)}
            alt={product.image.label || product.name}
            width={600}
            height={600}
            className="w-full rounded-lg shadow-lg mb-4"
            sizes="(max-width: 768px) 100vw, 50vw"
            loading="eager"
            fetchPriority="high"
          />
          {product.media_gallery.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.media_gallery.slice(0, 4).map((img, idx) => (
                <Image
                  key={idx}
                  src={magentoImageUrl(img.url)}
                  alt={img.label || product.name}
                  width={100}
                  height={80}
                  sizes="(max-width: 768px) 25vw, 12vw"
                  className="w-full h-20 object-cover rounded border hover:border-blue-500 cursor-pointer"
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          <p className="text-gray-600 mb-4">SKU: {product.sku}</p>

          <div className="mb-6">
            {hasDiscount ? (
              <div>
                <span className="text-3xl font-bold text-red-600">
                  {finalPrice.value.toFixed(2)} {finalPrice.currency}
                </span>
                <span className="text-xl text-gray-500 line-through ml-3">
                  {regularPrice.value.toFixed(2)} {regularPrice.currency}
                </span>
              </div>
            ) : (
              <span className="text-3xl font-bold text-blue-600">
                {finalPrice.value.toFixed(2)} {finalPrice.currency}
              </span>
            )}
          </div>

          <div className="mb-6">
            <span
              className={`inline-block px-3 py-1 rounded ${
                product.stock_status === "IN_STOCK"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {product.stock_status === "IN_STOCK"
                ? "In Stock"
                : "Out of Stock"}
            </span>
          </div>

          {product.short_description?.html && (
            <div
              className="mb-6 text-gray-700"
              dangerouslySetInnerHTML={{
                __html: product.short_description.html,
              }}
            />
          )}

          {product.categories && product.categories.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Categories:</h3>
              <div className="flex flex-wrap gap-2">
                {product.categories.map((cat) => (
                  <span
                    key={cat.id}
                    className="bg-gray-100 px-3 py-1 rounded text-sm"
                  >
                    {cat.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {product.description?.html && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Description</h2>
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: product.description.html }}
          />
        </div>
      )}
    </div>
  );
}
