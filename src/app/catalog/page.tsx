import Catalog from "@/src/app/components/CatalogTree/index";
import { Suspense } from "react";
import { fetchCatalog } from "@/src/app/utils/graphql/fetchers";

async function CatalogData() {
  const catalog = await fetchCatalog().catch(() => null);

  if (!catalog) {
    return <div>Failed to load catalog</div>;
  }

  return <Catalog catalog={catalog as Parameters<typeof Catalog>[0]["catalog"]} />;
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CatalogData />
    </Suspense>
  );
}
