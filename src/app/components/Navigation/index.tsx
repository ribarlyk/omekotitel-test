import Link from "next/link";
import { NAVGATIOM_ITEMS, NavCatalogCategory } from "../../constants";
import { CatalogToggle } from "./CatalogToggle";

export const Navigation = ({ categoryList }: { categoryList: NavCatalogCategory[] }) => {
  return (
    <div className="relative w-full">
      <nav className="hidden lg:block w-full bg-brand-nav border-b-2 border-brand-action">
        <ul className="flex flex-row items-center justify-center gap-8 px-6 py-3 text-lg">
          {NAVGATIOM_ITEMS.map((item) =>
            item.main ? (
              <li key={item.name}>
                <CatalogToggle label={item.name} categoryList={categoryList} />
              </li>
            ) : (
              <li key={item.name} className="py-1.5">
                <Link
                  href={item.href}
                  className="relative text-white after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-0.5 after:w-0 after:bg-white after:transition-all after:duration-300 hover:after:w-full"
                >
                  {item.name}
                </Link>
              </li>
            )
          )}
        </ul>
      </nav>
    </div>
  );
};
