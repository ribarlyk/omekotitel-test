import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Mutations } from "@/src/app/utils/graphql";
import { print } from "graphql";
import { fetchWithRetry } from "@/src/app/utils/fetchWithRetry";

const GRAPHQL_ENDPOINT = process.env.GRAPHQL_URL ?? "";

export async function POST(request: NextRequest) {
  try {
    if (!GRAPHQL_ENDPOINT) {
      return NextResponse.json(
        { error: "Server not configured" },
        { status: 500 }
      );
    }

    const { cartItemId } = await request.json();

    if (!cartItemId) {
      return NextResponse.json(
        { message: "Cart item ID is required" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;
    const cartId = cookieStore.get("cart-id")?.value;

    if (!cartId) {
      return NextResponse.json(
        { message: "No cart found" },
        { status: 404 }
      );
    }

    // Remove item from cart
    const removeFromCartMutation = print(Mutations.REMOVE_ITEM_FROM_CART);
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    // Idempotent (removing the same item twice is harmless) — safe to retry.
    const removeResp = await fetchWithRetry(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: removeFromCartMutation,
        variables: { cartId, cartItemId },
      }),
    });

    if (!removeResp.ok) {
      throw new Error("Failed to remove item from cart");
    }

    const removeData = await removeResp.json();

    if (removeData.errors) {
      console.error("GraphQL errors:", removeData.errors);
      return NextResponse.json(
        { message: removeData.errors[0]?.message || "Failed to remove item from cart" },
        { status: 400 }
      );
    }

    const cart = removeData.data?.removeItemFromCart?.cart;

    return NextResponse.json({ cart });
  } catch (error) {
    console.error("/api/cart/remove error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to remove from cart" },
      { status: 500 }
    );
  }
}
