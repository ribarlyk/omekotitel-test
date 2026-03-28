import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Mutations } from "@/src/app/utils/graphql";
import { print } from "graphql";

const GRAPHQL_ENDPOINT = process.env.GRAPHQL_URL ?? "";

export async function POST(request: NextRequest) {
  try {
    if (!GRAPHQL_ENDPOINT) {
      return NextResponse.json(
        { error: "Server not configured" },
        { status: 500 }
      );
    }

    const { sku, quantity } = await request.json();

    if (!sku || !quantity || quantity < 1) {
      return NextResponse.json(
        { message: "SKU and valid quantity are required" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;
    let cartId = cookieStore.get("cart-id")?.value;

    // If no cart ID exists, create a new cart first
    if (!cartId) {
      const createCartQuery = print(Mutations.CREATE_EMPTY_CART);
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const createResp = await fetch(GRAPHQL_ENDPOINT, {
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

      if (!cartId) {
        throw new Error("No cart ID returned");
      }

      cookieStore.set("cart-id", cartId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });
    }

    // Add product to cart
    const addToCartMutation = print(Mutations.ADD_PRODUCT_TO_CART);
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const addResp = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: addToCartMutation,
        variables: { cartId, sku, quantity },
      }),
    });

    if (!addResp.ok) {
      throw new Error("Failed to add product to cart");
    }

    const addData = await addResp.json();

    if (addData.errors) {
      console.error("GraphQL errors:", addData.errors);
      return NextResponse.json(
        { message: addData.errors[0]?.message || "Failed to add product to cart" },
        { status: 400 }
      );
    }

    const cart = addData.data?.addSimpleProductsToCart?.cart;

    return NextResponse.json({ cartId, cart });
  } catch (error) {
    console.error("/api/cart/add error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to add to cart" },
      { status: 500 }
    );
  }
}
