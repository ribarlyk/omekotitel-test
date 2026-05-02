"use client";

import Link from "next/link";
import { useAuthenticate } from "@/src/app/hooks/useAuthentication";
import { SECTION_LABELS, ProfileSection } from "@/src/app/components/Profile/sections";

const MENU_ITEMS: ProfileSection[] = [
  ProfileSection.Orders,
  ProfileSection.Wishlist,
  ProfileSection.Details,
];

interface Props {
  onClose: () => void;
}

export const ProfileDropdown = ({ onClose }: Props) => {
  const { handleLogout } = useAuthenticate();

  return (
    <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 shadow-lg rounded-sm min-w-44 z-50 py-1">
      {MENU_ITEMS.map((section, i) => (
        <div key={section}>
          <Link
            href={`/customer/account?section=${section}`}
            onClick={onClose}
            className="block px-5 py-2.5 text-sm text-gray-700 hover:text-brand-action transition-colors"
          >
            {SECTION_LABELS[section]}
          </Link>
          {i < MENU_ITEMS.length - 1 && <hr className="border-gray-100" />}
        </div>
      ))}
      <hr className="border-gray-100" />
      <button
        onClick={() => { handleLogout(); onClose(); }}
        className="block w-full text-left px-5 py-2.5 text-sm text-gray-700 hover:text-brand-action transition-colors cursor-pointer"
      >
        Изход
      </button>
    </div>
  );
};
