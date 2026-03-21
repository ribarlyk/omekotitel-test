"use client";

import Link from "next/link";
import { useState } from "react";
import { NAVGATIOM_ITEMS, NavCatalogCategory } from "../../constants";
import { NavCatalogDropdown } from "./NavCatalogDropdown";

const BurgerIcon = ({ isOpen }: { isOpen: boolean }) => (
  <div className="w-5 flex flex-col gap-1.25">
    <span
      className={`block h-0.5 bg-white rounded transition-all duration-300 origin-center ${
        isOpen ? "rotate-45 translate-y-1.75" : ""
      }`}
    />
    <span
      className={`block h-0.5 bg-white rounded transition-all duration-300 ${
        isOpen ? "opacity-0 scale-x-0" : ""
      }`}
    />
    <span
      className={`block h-0.5 bg-white rounded transition-all duration-300 origin-center ${
        isOpen ? "-rotate-45 -translate-y-1.75" : ""
      }`}
    />
  </div>
);

export const Navigation = ({ categoryList }: { categoryList: NavCatalogCategory[] }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative w-full">
      <nav className="hidden lg:block w-full bg-brand-nav">
        <ul className="flex flex-row items-center justify-center gap-8 px-6 py-3 text-lg">
          {NAVGATIOM_ITEMS.map((item) =>
            item.main ? (
              <li key={item.name} className="relative">
                <button
                  onClick={() => setIsOpen((prev) => !prev)}
                  className="text-white flex items-center gap-2.5 px-3 py-1.5 rounded-md bg-brand-action cursor-pointer"
                >
                  <BurgerIcon isOpen={isOpen} />
                  {item.name}
                </button>
                {isOpen && (
                  <div
                    className="absolute left-1/2 -translate-x-1/2 -bottom-3 w-0 h-0 z-51"
                    style={{
                      borderLeft: "8px solid transparent",
                      borderRight: "8px solid transparent",
                      borderTop: "10px solid #98ab3f",
                    }}
                  />
                )}
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

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <NavCatalogDropdown
            categoryList={categoryList}
            onClose={() => setIsOpen(false)}
          />
        </>
      )}
    </div>
  );
};
