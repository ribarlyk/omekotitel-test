"use client";

import { useState } from "react";
import { NavCatalogDropdown } from "./NavCatalogDropdown";
import type { NavCatalogCategory } from "../../constants";

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

export function CatalogToggle({
  label,
  categoryList,
}: {
  label: string;
  categoryList: NavCatalogCategory[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <span className="relative inline-flex items-center">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="text-white flex items-center gap-2.5 px-3 py-1.5 rounded-md bg-brand-action cursor-pointer"
        >
          <BurgerIcon isOpen={isOpen} />
          {label}
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
      </span>
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
    </>
  );
}
