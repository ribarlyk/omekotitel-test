import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Mutations } from "@/src/app/utils/graphql";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    const GRAPHQL_ENDPOINT = process.env.GRAPHQL_URL ?? "";

    if (token && GRAPHQL_ENDPOINT) {
      try {
        const query = Mutations.REVOKE_CUSTOMER_TOKEN;

        const response = await fetch(GRAPHQL_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ query }),
        });

        if (!response.ok) {
          console.warn(
            "Revoke mutation returned non-ok status",
            response.status
          );
        }
      } catch (e) {
        console.warn("Failed to call revoke-customer-token:", e);
      }
    }

    try {
      cookieStore.delete("auth-token");
      // The cart-id belongs to the now-signed-out customer's cart. A guest request
      // can't operate on it ("current user cannot perform operations on cart"), so
      // drop it — the next cart request creates a fresh guest cart.
      cookieStore.delete("cart-id");
    } catch (e) {
      console.warn("Failed to delete cookies:", e);
      cookieStore.set("auth-token", "", { path: "/", maxAge: 0 });
      cookieStore.set("cart-id", "", { path: "/", maxAge: 0 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("/api/auth/logout error:", err);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
