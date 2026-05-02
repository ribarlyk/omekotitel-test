"use client";

import { useRouter } from "next/navigation";
import { useAuthenticate } from "@/src/app/hooks/useAuthentication";
import { ProfileSection, SECTION_LABELS } from "@/src/app/components/Profile/sections";

// Sections with dedicated routes instead of ?section= param
const SECTION_ROUTES: Partial<Record<ProfileSection, string>> = {
  [ProfileSection.Orders]: "/sales/order/history",
};

const HIDDEN_SECTIONS = new Set([
  ProfileSection.Downloads,
  ProfileSection.Newsletter,
  ProfileSection.Payments,
  ProfileSection.Reviews,
]);

const SECTIONS = Object.values(ProfileSection).filter((s) => !HIDDEN_SECTIONS.has(s));

interface Props {
  activeSection: ProfileSection;
  onSectionChange: (section: ProfileSection) => void;
}

export const ProfileSidebar = ({ activeSection, onSectionChange }: Props) => {
  const { handleLogout } = useAuthenticate();
  const router = useRouter();

  const handleClick = (s: ProfileSection) => {
    const route = SECTION_ROUTES[s];
    if (route) {
      router.push(route);
    } else {
      onSectionChange(s);
    }
  };

  return (
    <aside className="w-full md:w-56 md:shrink-0 md:self-start lg:sticky lg:top-44 border-t border-gray-200 pt-6 md:border-0 md:pt-0">
      <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">
        Табло за управление на профила
      </h2>
      <div className="flex flex-col">
        {SECTIONS.map((s) => (
          <button
            key={s}
            onClick={() => handleClick(s)}
            className={`text-sm py-2 text-left transition-colors cursor-pointer border-b border-gray-100 last:border-0 ${
              activeSection === s
                ? "text-brand-action font-semibold bg-gray-50 px-2 -mx-2"
                : "text-gray-600 hover:text-brand-action"
            }`}
          >
            {SECTION_LABELS[s]}
          </button>
        ))}
        <button
          onClick={handleLogout}
          className="text-sm py-2 text-left text-gray-600 hover:text-brand-action transition-colors cursor-pointer mt-1"
        >
          Изход
        </button>
      </div>
    </aside>
  );
};
