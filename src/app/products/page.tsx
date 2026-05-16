import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import CategoryPage from "@/src/app/components/CategoryPage";
import { Aggregation } from "@/src/app/components/FilterSidebar";
import { fetchCatalog, fetchProductsByCategory } from "@/src/app/utils/graphql/fetchers";

async function CatalogContent() {
  const catalog = await fetchCatalog();
  const root = (catalog.categoryList as { id: number; name: string }[])[0];
  const data = await fetchProductsByCategory(String(root.id));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const products = (data.products?.items ?? []) as any[];
  const totalCount = data.products?.total_count ?? 0;
  const aggregations = (data.products?.aggregations ?? []) as Aggregation[];

  return (
    <CategoryPage
      categoryId={String(root.id)}
      categoryName="Всички продукти"
      initialProducts={products}
      initialTotalCount={totalCount}
      aggregations={aggregations}
    />
  );
}

export default function ProductsPage() {
  return (
    <div className="container mx-auto px-4 py-4 lg:py-8">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-12 h-12 animate-spin text-brand-action" />
          </div>
        }
      >
        <CatalogContent />
      </Suspense>
    </div>
  );
}
