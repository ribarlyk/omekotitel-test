import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { OrderDetail } from "@/src/app/components/Profile/OrderDetail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: Props) {
  const cookieStore = await cookies();
  if (!cookieStore.get("auth-token")?.value) redirect("/");
  const { id } = await params;
  return <OrderDetail orderId={id} />;
}
