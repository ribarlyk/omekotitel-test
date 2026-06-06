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
    } catch (e) {
      console.warn("Failed to delete cookies:", e);
      cookieStore.set("auth-token", "", { path: "/", maxAge: 0 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("/api/auth/logout error:", err);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
