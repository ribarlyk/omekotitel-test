import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Mutations } from "@/src/app/utils/graphql";
import { print } from "graphql";
import { fetchWithRetry } from "@/src/app/utils/fetchWithRetry";
import { isCartAuthError } from "@/src/app/utils/cartErrors";

const GRAPHQL_ENDPOINT = process.env.GRAPHQL_URL ?? "";

export async function POST(request: NextRequest) {
  try {
    if (!GRAPHQL_ENDPOINT) {
      return NextResponse.json({ error: "Server not configured" }, { status: 500 });
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

    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (authToken) headers.Authorization = `Bearer ${authToken}`;

    // Create a fresh cart for the current auth context and persist its id.
    const createCart = async (): Promise<string> => {
      const createResp = await fetchWithRetry(GRAPHQL_ENDPOINT, {
        method: "POST",
        headers,
        body: JSON.stringify({ query: print(Mutations.CREATE_EMPTY_CART) }),
      });
      if (!createResp.ok) {
        const errorText = await createResp.text();
        console.error("HTTP error creating cart:", createResp.status, errorText);
        throw new Error(`Failed to create cart: ${createResp.status} ${errorText.slice(0, 200)}`);
      }
      const createData = await createResp.json();
      if (createData.errors) {
        console.error("GraphQL errors:", createData.errors);
        throw new Error(`Failed to create cart: ${createData.errors[0]?.message || "Unknown error"}`);
      }
      const id = createData.data?.createEmptyCart;
      if (!id) throw new Error("No cart ID returned");
      cookieStore.set("cart-id", id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });
      return id;
    };

    // No auto-retry at the transport level — the add mutation is NOT idempotent, so a
    // network/timeout retry could add the quantity twice. Timeout only.
    const performAdd = async (cartId: string) => {
      const addResp = await fetchWithRetry(
        GRAPHQL_ENDPOINT,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            query: print(Mutations.ADD_PRODUCT_TO_CART),
            variables: { cartId, sku, quantity },
          }),
        },
        { retries: 0 },
      );
      if (!addResp.ok) {
        const errorText = await addResp.text();
        console.error("HTTP error adding to cart:", addResp.status, errorText);
        throw new Error(`Failed to add product to cart: ${addResp.status} ${errorText.slice(0, 200)}`);
      }
      return addResp.json();
    };

    let cartId = cookieStore.get("cart-id")?.value || (await createCart());

    let addData = await performAdd(cartId);

    // Stale cart cookie (customer cart used after logout, or expired token): Magento
    // rejects with a graphql-authorization error. Recreate a cart for the current
    // context and retry the add once so the user doesn't see a failure.
    if (addData.errors && isCartAuthError(addData.errors)) {
      cartId = await createCart();
      addData = await performAdd(cartId);
    }

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
