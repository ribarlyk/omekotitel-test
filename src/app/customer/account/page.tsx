import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Queries } from "@/src/app/utils/graphql";
import { print } from "graphql";
import { AccountLayout } from "@/src/app/components/Profile/Layout";
import type { CustomerAccount } from "@/src/app/types/customer";

async function getCustomer(): Promise<CustomerAccount | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return null;

  const resp = await fetch(process.env.GRAPHQL_URL ?? "", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query: print(Queries.GET_CUSTOMER) }),
    cache: "no-store",
  });

  const data = await resp.json();
  return data?.data?.customer ?? null;
}

export default async function CustomerAccountPage() {
  const customer = await getCustomer();
  if (!customer) redirect("/");
  return (
    <Suspense>
      <AccountLayout customer={customer} />
    </Suspense>
  );
}
