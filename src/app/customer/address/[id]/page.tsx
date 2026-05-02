import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Queries } from "@/src/app/utils/graphql";
import { print } from "graphql";
import { AddressFormPage } from "@/src/app/components/Profile/AddressFormPage";
import type { CustomerAddress } from "@/src/app/types/customer";

async function getAddress(id: number): Promise<CustomerAddress | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return null;

  const res = await fetch(process.env.GRAPHQL_URL ?? "", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ query: print(Queries.GET_CUSTOMER) }),
    cache: "no-store",
  });
  const data = await res.json();
  const addresses: CustomerAddress[] = data?.data?.customer?.addresses ?? [];
  return addresses.find((a) => a.id === id) ?? null;
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditAddressPage({ params }: Props) {
  const { id } = await params;
  const address = await getAddress(Number(id));
  if (!address) redirect("/customer/account?section=addresses");

  return (
    <AddressFormPage
      title="Редактирай адрес"
      initial={address}
      addressId={address.id}
    />
  );
}
