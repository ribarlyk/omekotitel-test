import MagentoImage from "@/src/app/components/MagentoImage";
import Link from "next/link";
import { fetchCatalog } from "@/src/app/utils/graphql/fetchers";
import { NavCatalogCategory } from "@/src/app/constants";
import { magentoImageUrl } from "@/src/app/utils/image";

const MAGENTO_ORIGIN = new URL(process.env.GRAPHQL_URL!).origin;

function brandImageUrl(image: string): string {
  if (image.startsWith("http")) return magentoImageUrl(image);
  return `${MAGENTO_ORIGIN}/pub/media/catalog/category/${image}`;
}

const BRANDS_CATEGORY_ID = 83;

function findBrandsCategory(list: NavCatalogCategory[]): NavCatalogCategory | null {
  for (const cat of list) {
    if (cat.id === BRANDS_CATEGORY_ID) return cat;
    if (cat.children?.length) {
      const found = findBrandsCategory(cat.children);
      if (found) return found;
    }
  }
  return null;
}

export default async function MarkiBrandsPage() {
  const catalog = await fetchCatalog();
  const brandsCategory = findBrandsCategory(catalog.categoryList as NavCatalogCategory[]);
  const brands = brandsCategory?.children ?? [];

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12">
      <h1 className="text-2xl lg:text-3xl font-bold text-center mb-8 text-brand-dark">
        Марки
      </h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {brands.map((brand) => (
          <Link
            key={brand.id}
            href={`/${brand.url_path}`}
            className="group flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-brand-action transition-all duration-200"
          >
            {brand.image ? (
              <div className="relative w-full aspect-square">
                <MagentoImage
                  src={brandImageUrl(brand.image!)}
                  alt={brand.name}
                  fill
                  className="object-contain p-2 group-hover:scale-105 transition-transform duration-200"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                />
              </div>
            ) : (
              <div className="w-full aspect-square flex items-center justify-center bg-gray-50 rounded-lg">
                <span className="text-sm font-semibold text-center text-gray-700 px-2 leading-tight">
                  {brand.name}
                </span>
              </div>
            )}
            <p className="mt-2 text-xs text-center text-gray-600 font-medium group-hover:text-brand-action transition-colors">
              {brand.name}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
