import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const auth = cookieStore.get("auth-token");
    const token = auth?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const GRAPHQL_ENDPOINT = process.env.GRAPHQL_URL ?? "";
    if (!GRAPHQL_ENDPOINT) {
      console.error("GRAPHQL_URL is not configured");
      return NextResponse.json(
        { error: "Server not configured" },
        { status: 500 }
      );
    }

    const query = `query { customer { email firstname lastname created_at is_subscribed} }`;

    const resp = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query }),
    });

    if (!resp.ok) {
      console.error("/api/me GraphQL HTTP error", resp.status);
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const data = await resp.json();

    if (data.errors || !data?.data?.customer) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { email, firstname, lastname, created_at, is_subscribed } =
      data.data.customer;

    return NextResponse.json({
      email,
      firstname,
      lastname,
      created_at,
      is_subscribed,
    });
  } catch (err) {
    console.error("/api/me error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
