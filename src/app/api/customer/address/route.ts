import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Mutations } from "@/src/app/utils/graphql";
import { print } from "graphql";

const GQL = process.env.GRAPHQL_URL ?? "";

async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get("auth-token")?.value ?? null;
}

async function gql(token: string, query: string, variables?: object) {
  const res = await fetch(GQL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

// POST /api/customer/address — create
export async function POST(req: NextRequest) {
  const token = await getToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const input = await req.json();
  const data = await gql(token, print(Mutations.CREATE_CUSTOMER_ADDRESS), { input });

  if (data.errors) return NextResponse.json({ error: data.errors[0].message }, { status: 400 });
  return NextResponse.json(data.data.createCustomerAddress);
}

// DELETE /api/customer/address?id=123 — delete
export async function DELETE(req: NextRequest) {
  const token = await getToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const data = await gql(token, print(Mutations.DELETE_CUSTOMER_ADDRESS), { id });
  if (data.errors) return NextResponse.json({ error: data.errors[0].message }, { status: 400 });
  return NextResponse.json({ success: true });
}
