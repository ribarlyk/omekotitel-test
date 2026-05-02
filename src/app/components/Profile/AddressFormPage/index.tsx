"use client";

import { useRouter } from "next/navigation";
import { ProfileSidebar } from "@/src/app/components/Profile/Sidebar";
import { ProfileSection } from "@/src/app/components/Profile/sections";
import { AddressForm } from "@/src/app/components/Profile/AddressForm";
import type { CustomerAddress } from "@/src/app/types/customer";

interface Props {
  title: string;
  initial?: CustomerAddress;
  addressId?: number;
}

export const AddressFormPage = ({ title, initial, addressId }: Props) => {
  const router = useRouter();

  const setSection = (s: ProfileSection) => {
    router.push(`/customer/account?section=${s}`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-10 flex flex-col-reverse md:flex-row gap-8 md:gap-10">
      <ProfileSidebar activeSection={ProfileSection.Addresses} onSectionChange={setSection} />
      <main className="flex-1 min-w-0">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        </div>
        <AddressForm initial={initial} addressId={addressId} />
      </main>
    </div>
  );
};
