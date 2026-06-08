import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Mutations, Queries } from "@/src/app/utils/graphql";
import { print } from "graphql";
import { fetchWithRetry } from "@/src/app/utils/fetchWithRetry";
import { isCartAuthError } from "@/src/app/utils/cartErrors";

const GRAPHQL_ENDPOINT = process.env.GRAPHQL_URL ?? "";

export async function GET() {
  try {
    if (!GRAPHQL_ENDPOINT) {
      return NextResponse.json(
        { error: "Server not configured" },
        { status: 500 }
      );
    }

    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;
    let cartId = cookieStore.get("cart-id")?.value;

    // If no cart ID exists, create a new cart
    if (!cartId) {
      const createCartQuery = print(Mutations.CREATE_EMPTY_CART);
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      // If user is authenticated, include auth token
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const createResp = await fetchWithRetry(GRAPHQL_ENDPOINT, {
        method: "POST",
        headers,
        body: JSON.stringify({ query: createCartQuery }),
      });

      if (!createResp.ok) {
        throw new Error("Failed to create cart");
      }

      const createData = await createResp.json();

      if (createData.errors) {
        console.error("GraphQL errors:", createData.errors);
        throw new Error("Failed to create cart");
      }

      cartId = createData.data?.createEmptyCart;

      if (cartId) {
        cookieStore.set("cart-id", cartId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 60 * 60 * 24 * 30, // 30 days
          path: "/",
        });
      }
    }

    // Fetch cart details
    if (cartId) {
      const getCartQuery = print(Queries.GET_CUSTOMER_CART);
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const cartResp = await fetchWithRetry(GRAPHQL_ENDPOINT, {
        method: "POST",
        headers,
        body: JSON.stringify({
          query: getCartQuery,
          variables: { cartId },
        }),
      });

      if (!cartResp.ok) {
        throw new Error("Failed to fetch cart");
      }

      const cartData = await cartResp.json();

      if (cartData.errors) {
        console.error("GraphQL errors:", cartData.errors);
        // Only drop the cart-id when it's genuinely unusable in this auth context
        // (stale customer cart after logout / expired token). For transient Magento
        // errors we keep the cookie so a blip doesn't wipe a still-valid cart.
        if (isCartAuthError(cartData.errors)) {
          cookieStore.delete("cart-id");
        }
        return NextResponse.json({ cartId: null, cart: null });
      }

      return NextResponse.json({
        cartId,
        cart: cartData.data?.cart || null,
      });
    }

    return NextResponse.json({ cartId: null, cart: null });
  } catch (error) {
    console.error("/api/cart GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cart" },
      { status: 500 }
    );
  }
}
