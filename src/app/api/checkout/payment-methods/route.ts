import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const GRAPHQL_ENDPOINT = process.env.GRAPHQL_URL ?? "";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;
    const cartId = cookieStore.get("cart-id")?.value;

    if (!cartId) {
      return NextResponse.json({ paymentMethods: [] });
    }

    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (authToken) headers.Authorization = `Bearer ${authToken}`;

    const res = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: `query GetPaymentMethods($cartId: String!) {
          cart(cart_id: $cartId) {
            available_payment_methods { code title }
          }
        }`,
        variables: { cartId },
      }),
    });

    const data = await res.json();
    const paymentMethods = data.data?.cart?.available_payment_methods ?? [];
    return NextResponse.json({ paymentMethods });
  } catch {
    return NextResponse.json({ paymentMethods: [] });
  }
}
