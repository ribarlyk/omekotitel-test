import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Mutations } from "@/src/app/utils/graphql";
import { print } from "graphql";
import { getAdminToken, MAGENTO_REST } from "@/src/app/utils/magentoAdmin";

const REST = (process.env.GRAPHQL_URL ?? "").replace(/\/graphql\/?$/, "") + "/rest/V1";
const GQL = process.env.GRAPHQL_URL ?? "";

async function getCustomerId(token: string): Promise<number | null> {
  const res = await fetch(`${REST}/customers/me`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json())?.id ?? null;
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const orderRes = await fetch(`${MAGENTO_REST}/orders/${id}`, {
      headers: { Authorization: `Bearer ${adminToken}`, Accept: "application/json" },
      cache: "no-store",
    });

    if (!orderRes.ok) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    const order = await orderRes.json();

    if (order.customer_id !== customerId) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Get or create cart
    let cartId = cookieStore.get("cart-id")?.value;
    if (!cartId) {
      const cartRes = await fetch(GQL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ query: print(Mutations.CREATE_EMPTY_CART) }),
      });
      const cartData = await cartRes.json();
      cartId = cartData.data?.createEmptyCart;
      if (cartId) {
        cookieStore.set("cart-id", cartId, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", maxAge: 60 * 60 * 24 * 30, path: "/" });
      }
    }

    if (!cartId) return NextResponse.json({ error: "Failed to create cart" }, { status: 500 });

    const simpleItems = (order.items ?? []).filter(
      (item: { product_type: string; qty_ordered: number }) =>
        item.product_type !== "configurable" && item.qty_ordered > 0
    );

    for (const item of simpleItems) {
      await fetch(GQL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          query: print(Mutations.ADD_PRODUCT_TO_CART),
          variables: { cartId, sku: item.sku, quantity: item.qty_ordered },
        }),
      });
    }

    return NextResponse.json({ success: true, cartId });
  } catch (err) {
    console.error("[reorder]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
