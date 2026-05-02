import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { OrdersList } from "@/src/app/components/Profile/OrdersList";

export default async function OrdersHistoryPage() {
  const cookieStore = await cookies();
  if (!cookieStore.get("auth-token")?.value) redirect("/");
  return (
    <Suspense>
      <OrdersList />
    </Suspense>
  );
}
