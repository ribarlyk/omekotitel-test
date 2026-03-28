import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Mutations } from "@/src/app/utils/graphql";
import { print } from "graphql";
import { verifyTurnstile } from "@/src/app/utils/turnstile";

export async function POST(request: NextRequest) {
  try {
    const { email, password, cfToken } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }
    if (typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    if (typeof password !== "string" || password.length > 128) {
      return NextResponse.json({ error: "Invalid password" }, { status: 400 });
    }
    if (!cfToken || !(await verifyTurnstile(cfToken))) {
      return NextResponse.json({ error: "Невалидна CAPTCHA. Опитайте отново." }, { status: 400 });
    }

    const GRAPHQL_ENDPOINT = process.env.GRAPHQL_URL ?? "";

    if (!GRAPHQL_ENDPOINT) {
      console.error("GRAPHQL_URL is not configured");
      return NextResponse.json(
        { error: "Server not configured" },
        { status: 500 }
      );
    }

    const genQuery = print(Mutations.GENERATE_AUTH_TOKEN);

    const genResp = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: genQuery, variables: { email, password } }),
    });
    if (!genResp.ok) {
      console.error(
        "GraphQL HTTP error during token generation",
        genResp.status
      );
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    const genData = await genResp.json();
    if (genData.errors || !genData?.data?.generateCustomerToken?.token) {
      console.error("GraphQL token errors:", genData.errors ?? genData);
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = genData.data.generateCustomerToken.token;

    const cookieStore = await cookies();

    // Capture guest cart ID before it gets overwritten
    const guestCartId = cookieStore.get("cart-id")?.value ?? null;

    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    const authHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    // Create an empty cart for the signed-in customer (server-side)
    let cartId: string | null = null;
    try {
      const cartResp = await fetch(GRAPHQL_ENDPOINT, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ query: print(Mutations.CREATE_CART_AFTER_SIGNIN) }),
      });

      if (cartResp.ok) {
        const cartData = await cartResp.json();
        cartId = cartData?.data?.cartId ?? null;
      } else {
        console.warn("Cart creation HTTP error", cartResp.status);
      }
    } catch (err) {
      console.warn("Failed to create cart after sign-in:", err);
    }

    // Merge guest cart into customer cart if guest had items
    if (cartId && guestCartId && guestCartId !== cartId) {
      try {
        const mergeResp = await fetch(GRAPHQL_ENDPOINT, {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            query: print(Mutations.MERGE_CARTS),
            variables: { sourceCartId: guestCartId, destinationCartId: cartId },
          }),
        });
        if (mergeResp.ok) {
          const mergeData = await mergeResp.json();
          // mergeCarts returns the destination cart — id stays the same
          if (mergeData.errors) {
            console.warn("Cart merge errors:", mergeData.errors);
          }
        }
      } catch (err) {
        console.warn("Failed to merge guest cart:", err);
      }
    }

    if (cartId) {
      cookieStore.set("cart-id", cartId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
    }

    return NextResponse.json({ success: true, cartId });
  } catch (error) {
    console.error("/api/login error:", error);
    return NextResponse.json(
      { error: "Failed to authenticate" },
      { status: 500 }
    );
  }
}
