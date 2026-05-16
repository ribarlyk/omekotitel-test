import { fetchCatalog, fetchProductsByCategory } from "@/src/app/utils/graphql/fetchers";
import ProductSlider from "@/src/app/components/ProductSlider";

interface Category {
  id: number;
  name: string;
  url_key: string | null;
  url_path: string | null;
  children?: Category[];
}

function findCategoryByUrlKey(list: Category[], urlKey: string): Category | null {
  for (const cat of list) {
    if (cat.url_key === urlKey) return cat;
    if (cat.children?.length) {
      const found = findCategoryByUrlKey(cat.children, urlKey);
      if (found) return found;
    }
  }
  return null;
}

interface HomeCategorySectionProps {
  urlKey: string;
  title: string;
  pageSize?: number;
  href?: string;
}

export default async function HomeCategorySection({
  urlKey,
  title,
  pageSize = 10,
  href,
}: HomeCategorySectionProps) {
  const catalog = await fetchCatalog();
  const category = findCategoryByUrlKey(catalog.categoryList as Category[], urlKey);
  if (!category) return null;

  const data = await fetchProductsByCategory(String(category.id), pageSize);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const products = (data.products?.items ?? []).filter(Boolean) as any[];

  if (!products.length) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 pt-5 pb-6">
      <ProductSlider title={title} products={products} viewAllHref={href ?? `/${urlKey}`} titleSize="text-lg lg:text-2xl" outerClassName="mt-4" />
    </section>
  );
}
