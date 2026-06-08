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

    const { cartItemId, quantity } = await request.json();

    if (!cartItemId || !quantity || quantity < 1) {
      return NextResponse.json(
        { message: "Cart item ID and valid quantity are required" },
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

    // Update cart item quantity
    const updateCartMutation = print(Mutations.UPDATE_CART_ITEM_QUANTITY);
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    // Idempotent (setting quantity to N twice yields the same state) — safe to retry.
    const updateResp = await fetchWithRetry(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: updateCartMutation,
        variables: { cartId, cartItemId, quantity },
      }),
    });

    if (!updateResp.ok) {
      throw new Error("Failed to update cart item");
    }

    const updateData = await updateResp.json();

    if (updateData.errors) {
      console.error("GraphQL errors:", updateData.errors);
      return NextResponse.json(
        { message: updateData.errors[0]?.message || "Failed to update cart item" },
        { status: 400 }
      );
    }

    const cart = updateData.data?.updateCartItems?.cart;

    return NextResponse.json({ cart });
  } catch (error) {
    console.error("/api/cart/update error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to update cart" },
      { status: 500 }
    );
  }
}
