import Link from "next/link";
import { fetchCatalog, fetchProductsByCategory } from "@/src/app/utils/graphql/fetchers";
import ProductsList from "@/src/app/components/ProductsList";

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
}

export default async function HomeCategorySection({
  urlKey,
  title,
  pageSize = 4,
}: HomeCategorySectionProps) {
  const catalog = await fetchCatalog();
  const category = findCategoryByUrlKey(catalog.categoryList as Category[], urlKey);
  if (!category) return null;

  const data = await fetchProductsByCategory(String(category.id), pageSize);
  const products = (data.products?.items ?? []).filter(Boolean) as Parameters<
    typeof ProductsList
  >[0]["products"];

  if (!products.length) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 pt-5 pb-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        <Link
          href={`/${urlKey}`}
          className="text-sm font-medium text-brand-nav hover:text-brand-action transition-colors"
        >
          Виж всички →
        </Link>
      </div>
      <ProductsList products={products} />
    </section>
  );
}
