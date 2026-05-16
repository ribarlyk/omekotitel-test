import { fetchSearchProducts } from "@/src/app/utils/graphql/fetchers";
import SearchPage from "@/src/app/components/SearchPage";
import { Aggregation } from "@/src/app/components/FilterSidebar";

export default async function SearchPageRoute({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim().slice(0, 200) ?? "";

  if (!query) {
    return (
      <div className="container mx-auto px-4 py-8 text-gray-500">
        Въведете дума за търсене.
      </div>
    );
  }

  const data = await fetchSearchProducts(query, 20);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const products = (data?.products?.items ?? []) as any[];
  const totalCount = data?.products?.total_count ?? 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const aggregations = ((data?.products as any)?.aggregations ?? []) as Aggregation[];

  return (
    <div className="container mx-auto px-4 py-4 lg:py-8">
      <SearchPage
        query={query}
        initialProducts={products}
        initialTotalCount={totalCount}
        aggregations={aggregations}
      />
    </div>
  );
}
