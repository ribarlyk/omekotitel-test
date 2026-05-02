import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminToken, MAGENTO_REST } from "@/src/app/utils/magentoAdmin";

const REST = (process.env.GRAPHQL_URL ?? "").replace(/\/graphql\/?$/, "") + "/rest/V1";

async function getCustomerId(token: string): Promise<number | null> {
  const res = await fetch(`${REST}/customers/me`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.id ?? null;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const [customerId, adminToken] = await Promise.all([
      getCustomerId(token),
      getAdminToken(),
    ]);

    if (!customerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const res = await fetch(`${MAGENTO_REST}/orders/${id}`, {
      headers: { Authorization: `Bearer ${adminToken}`, Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const order = await res.json();
    // Security: ensure this order belongs to the logged-in customer
    if (order.customer_id !== customerId) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (err) {
    console.error("[order detail]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
