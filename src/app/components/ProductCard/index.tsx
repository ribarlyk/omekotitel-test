import { magentoImageUrl } from "@/src/app/utils/image";
import MagentoImage from "@/src/app/components/MagentoImage";
import { isProductNew, isProductOnSale, discountPercent } from "@/src/app/utils/productBadges";
import type { ViewMode } from "@/src/app/components/SortToolbar";
import { AddToCartActions } from "./AddToCartActions";
import { ProductLink } from "./ProductLink";

export interface ProductCardProduct {
  id: string;
  name: string;
  sku: string;
  price_range: {
    minimum_price: {
      final_price: { value: number; currency: string };
      regular_price?: { value: number; currency: string };
      discount?: { percent_off: number; amount_off: number } | null;
    };
  } | null;
  small_image: { url: string; label: string } | null;
  url_key: string;
  new_from_date?: string | null;
  new_to_date?: string | null;
  special_price?: number | null;
  special_from_date?: string | null;
  special_to_date?: string | null;
  type_id?: string | null;
}

interface ProductCardProps {
  product: ProductCardProduct;
  index?: number;
  view?: ViewMode;
  imageSizes?: string;
}

// Matches ProductsList grid: 2 cols default, 3 cols lg (≥1024px), 4 cols xl (≥1280px)
const DEFAULT_GRID_SIZES =
  "(max-width: 1024px) calc(50vw - 1rem), (max-width: 1280px) calc(33vw - 1rem), calc(25vw - 1rem)";

export default function ProductCard({ product, index = 0, view = "grid", imageSizes }: ProductCardProps) {
  const finalPrice = product.price_range?.minimum_price.final_price;
  const regularPrice = product.price_range?.minimum_price.regular_price;

  const isOnSale = isProductOnSale(product);
  const discountPct = discountPercent(product);
  const isNew = isProductNew(product);
  const isConfigurable = product.type_id === "configurable";

  // Eager-load the first row (grid is up to 4 columns on xl) so the LCP candidate
  // — whichever above-the-fold card the browser picks — isn't held back by lazy loading.
  // Only the very first card gets fetchPriority=high.
  const imageLoadingProps = {
    loading: (index < 4 ? "eager" : "lazy") as "eager" | "lazy",
    fetchPriority: (index === 0 ? "high" : "auto") as "high" | "auto",
  };

  const badges = (
    <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none">
      {isNew && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500 text-white shadow tracking-wide uppercase">
          Ново
        </span>
      )}
      {isOnSale && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500 text-white shadow tracking-wide">
          -{discountPct}%
        </span>
      )}
    </div>
  );

  const priceBlock = (
    <div>
      {isOnSale ? (
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 line-through leading-none mb-0.5">
            {regularPrice!.value.toFixed(2)} {regularPrice!.currency}
          </span>
          <span className="text-lg font-bold text-rose-600 leading-tight">
            {isConfigurable && <span className="font-normal text-base">от </span>}
            {finalPrice!.value.toFixed(2)} {finalPrice!.currency}
          </span>
        </div>
      ) : (
        <span className="text-lg font-bold text-brand-action leading-tight">
          {isConfigurable && <span className="font-normal text-base">от </span>}
          {finalPrice ? `${finalPrice.value.toFixed(2)} ${finalPrice.currency}` : "—"}
        </span>
      )}
    </div>
  );

  if (view === "list") {
    return (
      <ProductLink
        urlKey={product.url_key}
        className="flex gap-4 border border-gray-200 rounded-xl bg-white hover:shadow-lg hover:border-brand-action/40 transition-all duration-200 group overflow-hidden"
      >
        <div className="relative shrink-0 overflow-hidden w-30">
          {product.small_image && (
            <MagentoImage
              src={magentoImageUrl(product.small_image.url)}
              alt={product.small_image.label || product.name}
              width={120}
              height={120}
              style={{ width: "120px", height: "120px", objectFit: "contain" }}
              className="transition-transform duration-300 group-hover:scale-105"
              sizes="120px"
              {...imageLoadingProps}
            />
          )}
          {badges}
        </div>
        <div className="flex flex-col justify-between py-4 pr-4 flex-1 min-w-0">
          <h3 className="font-medium text-sm mb-2 text-gray-800 group-hover:text-brand-nav transition-colors leading-snug">
            {product.name}
          </h3>
          <div className="flex items-end justify-between gap-3 flex-wrap">
            {priceBlock}
            <div className="shrink-0 w-36">
              <AddToCartActions product={product} />
            </div>
          </div>
        </div>
      </ProductLink>
    );
  }

  return (
    <ProductLink
      urlKey={product.url_key}
      className="flex flex-col h-full border border-gray-200 rounded-xl bg-white hover:shadow-xl hover:border-brand-action/40 transition-all duration-200 group overflow-hidden"
    >
      <div className="relative overflow-hidden">
        {product.small_image && (
          <MagentoImage
            src={magentoImageUrl(product.small_image.url)}
            alt={product.small_image.label || product.name}
            width={200}
            height={200}
            style={{ width: "100%", height: "200px", objectFit: "contain" }}
            className="transition-transform duration-300 group-hover:scale-105"
            sizes={imageSizes ?? DEFAULT_GRID_SIZES}
            {...imageLoadingProps}
          />
        )}
        {badges}
      </div>

      <div className="flex flex-col p-4 flex-1">
        <h3 className="font-medium text-sm mb-3 flex-1 text-gray-800 group-hover:text-brand-nav transition-colors leading-snug">
          {product.name}
        </h3>
        <div className="mt-auto flex flex-col gap-3">
          {priceBlock}
          <AddToCartActions product={product} />
        </div>
      </div>
    </ProductLink>
  );
}
