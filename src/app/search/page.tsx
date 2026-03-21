import { fetchSearchProducts } from "@/src/app/utils/graphql/fetchers";
import ProductsList from "@/src/app/components/ProductsList";

export default async function SearchPage({
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

  const data = await fetchSearchProducts(query);
  const products = (data?.products?.items ?? []) as Parameters<typeof ProductsList>[0]["products"];
  const totalCount = data?.products?.total_count ?? 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-brand-nav mb-6">
        Резултати за &ldquo;{query}&rdquo;
      </h1>
      <ProductsList products={products} totalCount={totalCount} />
      {totalCount === 0 && (
        <p className="text-gray-500 mt-4">Няма намерени продукти.</p>
      )}
    </div>
  );
}
