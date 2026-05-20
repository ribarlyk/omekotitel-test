import type { ProductOGMetaInput } from "@/src/app/utils/seo";
import { PRICE_CURRENCY } from "@/src/app/utils/seo";

// Next.js Metadata API `other` renders <meta name="…"> not <meta property="…">,
// so product:* Open Graph tags cannot be emitted through generateMetadata.
// This Server Component renders them directly in <body>; social scrapers
// (Facebook, Pinterest, LinkedIn) parse OG tags from the full HTML document.
export function ProductOGMeta({ price, currency, inStock, brand }: ProductOGMetaInput) {
  const cur = currency ?? PRICE_CURRENCY;
  const availability = inStock ? "in stock" : "out of stock";

  return (
    <>
      <meta property="og:type" content="product" />
      <meta property="product:price:amount" content={price.toFixed(2)} />
      <meta property="product:price:currency" content={cur} />
      <meta property="product:availability" content={availability} />
      <meta property="product:condition" content="new" />
      {brand && <meta property="product:brand" content={brand} />}
    </>
  );
}
