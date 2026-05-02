"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ProfileSidebar } from "@/src/app/components/Profile/Sidebar";
import { ProfileWishlist } from "@/src/app/components/Profile/Wishlist";
import { AccountDashboard } from "@/src/app/components/Profile/AccountDashboard";
import { ProfileEdit } from "@/src/app/components/Profile/ProfileEdit";
import { AddressBook } from "@/src/app/components/Profile/AddressBook";
import { ProfileSection } from "@/src/app/components/Profile/sections";
import type { CustomerAccount } from "@/src/app/types/customer";

interface Props {
  customer: CustomerAccount;
}

export const AccountLayout = ({ customer }: Props) => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const raw = searchParams.get("section");
  const section = Object.values(ProfileSection).includes(raw as ProfileSection)
    ? (raw as ProfileSection)
    : ProfileSection.Dashboard;

  const setSection = (s: ProfileSection) => {
    if (s === ProfileSection.Orders) {
      router.push("/sales/order/history");
      return;
    }
    router.replace(`/customer/account?section=${s}`, { scroll: false });
  };

  useEffect(() => {
    if (section === ProfileSection.Orders) {
      router.replace("/sales/order/history");
    }
  }, [section, router]);

  if (section === ProfileSection.Orders) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-10 flex flex-col-reverse md:flex-row gap-8 md:gap-10">
      <ProfileSidebar activeSection={section} onSectionChange={setSection} />
      <main className="flex-1 min-w-0">
        {section === ProfileSection.Dashboard && (
          <AccountDashboard customer={customer} onSectionChange={setSection} />
        )}
        {section === ProfileSection.Details && (
          <ProfileEdit
            firstname={customer.firstname}
            lastname={customer.lastname}
            email={customer.email}
          />
        )}
        {section === ProfileSection.Addresses && (
          <AddressBook addresses={customer.addresses} />
        )}
        {section === ProfileSection.Wishlist && <ProfileWishlist />}
        {section !== ProfileSection.Dashboard &&
          section !== ProfileSection.Details &&
          section !== ProfileSection.Addresses &&
          section !== ProfileSection.Wishlist && (
            <p className="text-gray-400 text-sm">Тази секция предстои.</p>
          )}
      </main>
    </div>
  );
};

// Keep old export name for any leftover imports
export const ProfileLayout = AccountLayout;
